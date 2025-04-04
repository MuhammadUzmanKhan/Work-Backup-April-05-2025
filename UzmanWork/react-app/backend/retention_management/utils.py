import logging
from collections import defaultdict
from datetime import timedelta
from typing import TYPE_CHECKING, Any, Awaitable, Callable

from botocore.exceptions import ClientError
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from backend.boto_utils import BotoSessionFn
from backend.database import database, orm
from backend.database.models import CameraRetentionInfo, ResourceRetentionData
from backend.retention_management.constants import S3_BATCH_DELETE_LIMIT
from backend.retention_management.exceptions import (
    ResourceDeleteError,
    ResourceS3DeleteError,
    RetentionTaskError,
)
from backend.s3_utils import S3Path, get_s3_client
from backend.sync_utils import run_async
from backend.utils import AwareDatetime

# from https://github.com/python/typeshed/issues/7855
if TYPE_CHECKING:
    _LoggerAdapter = logging.LoggerAdapter[logging.Logger]
else:
    _LoggerAdapter = logging.LoggerAdapter


class CustomAdapter(_LoggerAdapter):
    def process(self, msg: str, kwargs: Any) -> tuple[str, Any]:
        return f"[retention management] {msg}", kwargs


retention_logger = CustomAdapter(logging.getLogger(__name__))
logging.basicConfig(level=logging.INFO)


def _arrange_s3_paths_per_bucket(paths: list[S3Path]) -> dict[str, list[S3Path]]:
    """
    Given a list of s3 paths from different buckets, return a dict of lists of paths
    per bucket.
    """
    paths_per_bucket: defaultdict[str, list[S3Path]] = defaultdict(list)
    for path in paths:
        clip_bucket, _ = path.bucket_and_key(True)
        paths_per_bucket[clip_bucket].append(path)
    return paths_per_bucket


async def s3_batch_delete(s3_client: Any, paths: list[S3Path]) -> None:
    paths_per_bucket = _arrange_s3_paths_per_bucket(paths)
    for bucket, paths in paths_per_bucket.items():
        # NOTE(@lberg): batch delete is limited to how many objects can be deleted
        # NOTE(@lberg): itertools.batched is only available in python 3.12
        for i in range(0, len(paths), S3_BATCH_DELETE_LIMIT):
            paths_batch = paths[i : i + S3_BATCH_DELETE_LIMIT]
            try:
                results = await run_async(
                    lambda: s3_client.delete_objects(
                        Bucket=bucket,
                        Delete={
                            "Objects": [
                                {"Key": path.bucket_and_key(True)[1]}
                                for path in paths_batch
                            ],
                            "Quiet": True,
                        },
                    )
                )
            except ClientError as ex:
                raise ResourceS3DeleteError(
                    f"Failed to delete resource from bucket {bucket}: {ex}"
                )
            # delete_objects returns a dict with a list of errors if any
            if results.get("Errors") and len(results["Errors"]) > 0:
                raise ResourceS3DeleteError(
                    f"Failed to delete resource from bucket {bucket}:"
                    f" {results['Errors']}"
                )


ResourceFetchFunction = Callable[
    [AsyncSession, str, AwareDatetime, int | None],
    Awaitable[list[ResourceRetentionData]],
]

ResourceDeleteFunction = Callable[
    [AsyncSession, str, AwareDatetime, AwareDatetime], Awaitable[None]
]


async def _fetch_with_limit(
    session: AsyncSession,
    resources_fetch_fn: ResourceFetchFunction,
    mac_address: str,
    end_time: AwareDatetime,
    limit: int,
) -> list[ResourceRetentionData]:
    """Fetch resources with a limit. Ensure that we are robust to resources with the
    same timestamp.
    """
    resources_data = await resources_fetch_fn(session, mac_address, end_time, limit)
    if not resources_data:
        return resources_data
    # We refetch again using the current timestamps to ensure that we don't
    # cut off resources with the same timestamp.
    # NOTE(@lberg): we might be fetching more than the limit here.
    sorted_times = sorted([resource.timestamp for resource in resources_data])
    end_time_delete = sorted_times[-1]
    resources_data = await resources_fetch_fn(
        session, mac_address, end_time_delete, None
    )
    return resources_data


async def delete_over_retention_camera_resource(
    camera_info: CameraRetentionInfo,
    db: database.Database,
    s3_client: Any,
    resources_fetch_fn: ResourceFetchFunction,
    resources_delete_fn: ResourceDeleteFunction,
    delete_limit: int,
    time_now: AwareDatetime,
) -> None:
    end_time_retention = time_now - timedelta(days=camera_info.retention_days)
    try:
        async with db.session(
            session_type=database.SessionType.MODERATELY_SLOW_QUERY
        ) as session:
            resources_data = await _fetch_with_limit(
                session,
                resources_fetch_fn,
                camera_info.mac_address,
                end_time_retention,
                delete_limit,
            )
    except SQLAlchemyError as ex:
        raise ResourceDeleteError(f"Failed to fetch resources for {camera_info=}: {ex}")
    if not resources_data:
        retention_logger.info(
            f"no resources to delete for {camera_info=} until {end_time_retention}"
        )
        return

    s3_paths = [
        s3_path
        for resource_data in resources_data
        for s3_path in resource_data.s3_paths
    ]
    await s3_batch_delete(s3_client, s3_paths)
    # only delete from db if we successfully deleted from s3
    sorted_times = sorted([resource.timestamp for resource in resources_data])
    start_time_delete = sorted_times[0]
    end_time_retention = sorted_times[-1]
    try:
        async with db.session(
            session_type=database.SessionType.MODERATELY_SLOW_QUERY
        ) as session:
            await resources_delete_fn(
                session, camera_info.mac_address, start_time_delete, end_time_retention
            )
    except SQLAlchemyError as ex:
        raise ResourceDeleteError(
            f"Failed to delete resources for {camera_info=}: {ex}"
        )
    retention_logger.info(
        f"deleted {len(s3_paths)} S3 resources and {len(resources_data)} DB resources"
        f" for {camera_info=} between {start_time_delete} and {end_time_retention}"
    )


async def enforce_resource_retention(
    db: database.Database,
    resource_name: str,
    boto_session_maker: BotoSessionFn,
    over_retention_resource_fetch: ResourceFetchFunction,
    over_retention_resource_delete: ResourceDeleteFunction,
    per_camera_delete_limit: int,
    time_now: AwareDatetime,
) -> list[ResourceDeleteError]:
    """Enforce Resource retention across cameras."""
    async with db.session() as session:
        cameras_info = await orm.Camera.system_cameras_retention_info(session)
    if not cameras_info:
        raise RetentionTaskError("No cameras found for retention update")

    try:
        s3_client = await get_s3_client(boto_session_maker)
    except ClientError as ex:
        raise RetentionTaskError(f"Failed to create s3 client: {ex}")

    errors = []
    # NOTE(@lberg): this is sequential. We might want to make it concurrent
    # but we should use a semaphore to limit the number of concurrent tasks
    for camera_info in cameras_info:
        camera_info.resource_name = resource_name
        try:
            # TODO(@lberg): this is moving the s3_client over the thread boundary
            await delete_over_retention_camera_resource(
                camera_info,
                db,
                s3_client,
                over_retention_resource_fetch,
                over_retention_resource_delete,
                per_camera_delete_limit,
                time_now,
            )
        except ResourceDeleteError as ex:
            errors.append(ex)
            continue
    return errors
