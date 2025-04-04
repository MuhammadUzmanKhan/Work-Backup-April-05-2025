import logging
import os
import shutil
import tempfile
import time
from collections import defaultdict
from pathlib import Path
from typing import Any

import fastapi
import ffmpeg
import orjson
from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, HTTPException, Request, Response

from backend import auth, auth_models, logging_config
from backend.boto_utils import BotoSessionFn
from backend.constants import STATIC_CLIPS_PATH
from backend.database import database, models, orm
from backend.database.orm.orm_thumbnail import ThumbnailError
from backend.dependencies import (
    get_aws_region,
    get_backend_database,
    get_backend_secrets,
    get_boto_session_maker,
    get_value_store,
)
from backend.envs import BackendSecrets
from backend.fastapi_utils import WithResponseExcludeNone
from backend.instrumentation.utils import instrument
from backend.kinesis_api.utils import gen_url_for_clip_path
from backend.models import AccessRestrictions
from backend.router_utils import check_camera_access
from backend.s3_utils import parse_s3_path
from backend.sync_utils import run_async
from backend.thumbnail.models import (
    OptionalThumbnailResponse,
    RequestRange,
    RequestTimelapse,
    ThumbnailResponse,
    ThumbnailResult,
    ThumbnailTimestampRequest,
    TimelapseImageResponse,
)
from backend.thumbnail.s3_sign_url import sign_thumbnails
from backend.thumbnail.utils import (
    filter_cameras_by_access,
    instrument_thumbnails_endpoint,
)
from backend.thumbnail.value_store_utils import ThumbnailKey, get_most_recent_thumbnails
from backend.utils import AwareDatetime
from backend.value_store.value_store import ValueStore

logger = logging.getLogger(logging_config.LOGGER_NAME)

thumbnail_router = WithResponseExcludeNone(
    APIRouter(
        prefix="/thumbnail",
        tags=["thumbnail"],
        generate_unique_id_function=lambda route: route.name,
    )
)


def orjson_serialize(data: Any) -> Response:
    def _default_json(obj: Any) -> Any:
        if isinstance(obj, ThumbnailResult):
            return obj.dict()
        elif isinstance(obj, OptionalThumbnailResponse):
            return obj.dict()
        elif isinstance(obj, AwareDatetime):
            return obj.isoformat()
        raise TypeError(f"Type is not JSON serializable: {obj.__class__}")

    return Response(
        orjson.dumps(data, option=orjson.OPT_NON_STR_KEYS, default=_default_json),
        media_type="application/json",
    )


@thumbnail_router.post(
    "/query_thumbnails_timestamps", response_model=list[OptionalThumbnailResponse]
)
async def query_thumbnails_timestamps(
    request: Request,
    thumbnail_requests: list[ThumbnailTimestampRequest],
    db: database.Database = Depends(get_backend_database),
    aws_region: str = Depends(get_aws_region),
    secrets: BackendSecrets = Depends(get_backend_secrets),
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
) -> Response:
    # Aggregate thumbnail requests by camera.
    camera_to_requests: dict[str, list[ThumbnailTimestampRequest]] = defaultdict(list)
    for thumbnail_request in thumbnail_requests:
        camera_to_requests[thumbnail_request.mac_address].append(thumbnail_request)
    async with db.tenant_session() as session:
        await check_camera_access(session, access, list(camera_to_requests.keys()))

        camera_to_thumbnails: dict[str, list[ThumbnailResult | None]] = {}
        for mac_address, requests in camera_to_requests.items():
            try:
                camera_to_thumbnails[mac_address] = (
                    await orm.Thumbnail.get_thumbnails_at_timestamp(
                        session=session, requests=requests
                    )
                )
            except ThumbnailError as e:
                raise HTTPException(
                    status_code=fastapi.status.HTTP_400_BAD_REQUEST, detail=str(e)
                )
    # reassemble the thumbnails in the same order as the requests
    thumbnails = []
    for thumbnail_request in thumbnail_requests:
        mac_address = thumbnail_request.mac_address
        thumbnails.append(camera_to_thumbnails[mac_address].pop(0))

    # NOTE(@lberg): because sign mutates in place, we can pass a subset here
    sign_thumbnails(
        thumbnails=[thumbnail for thumbnail in thumbnails if thumbnail is not None],
        aws_credentials=secrets.aws_credentials(),
        aws_region=aws_region,
    )
    await instrument(
        instrument_thumbnails_endpoint(request, thumbnails, app_user.tenant)
    )
    return orjson_serialize(
        [OptionalThumbnailResponse(response=thumbnail) for thumbnail in thumbnails]
    )


@thumbnail_router.post(
    "/query_thumbnails_range", response_model=dict[str, ThumbnailResponse]
)
async def query_thumbnails_range(
    request: Request,
    thumbnail_request: RequestRange,
    db: database.Database = Depends(get_backend_database),
    aws_region: str = Depends(get_aws_region),
    secrets: BackendSecrets = Depends(get_backend_secrets),
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
) -> Response:
    async with db.tenant_session() as session:
        await check_camera_access(
            session, access, [thumbnail_request.camera_mac_address]
        )
        sample_interval = (
            thumbnail_request.end_time - thumbnail_request.start_time
        ) / thumbnail_request.max_num_images
        thumbnails = await orm.Thumbnail.sample_thumbnails(
            session=session,
            camera_mac_address=thumbnail_request.camera_mac_address,
            start_time=thumbnail_request.start_time,
            end_time=thumbnail_request.end_time,
            sample_interval=sample_interval,
        )

    sign_thumbnails(
        thumbnails=thumbnails.values(),
        aws_credentials=secrets.aws_credentials(),
        aws_region=aws_region,
    )

    await instrument(
        instrument_thumbnails_endpoint(request, thumbnails, app_user.tenant)
    )
    return orjson_serialize(thumbnails)


@thumbnail_router.post(
    "/most_recent_thumbnails", response_model=dict[str, ThumbnailResponse]
)
async def retrieve_most_recent_thumbnails(
    request: Request,
    camera_mac_addresses: list[str],
    db: database.Database = Depends(get_backend_database),
    value_store: ValueStore = Depends(get_value_store),
    aws_region: str = Depends(get_aws_region),
    secrets: BackendSecrets = Depends(get_backend_secrets),
    app_user: auth_models.AppUser = Depends(auth.live_only_user_role_guard),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
) -> Response:
    async with db.tenant_session() as session:
        camera_mac_addresses = await filter_cameras_by_access(
            session, access, camera_mac_addresses
        )
        thumbnails = await get_most_recent_thumbnails(
            value_store,
            [
                ThumbnailKey(
                    camera_mac_address=mac_address,
                    thumbnail_type=models.ThumbnailType.THUMBNAIL,
                )
                for mac_address in camera_mac_addresses
            ],
        )

    sign_thumbnails(
        thumbnails=thumbnails.values(),
        aws_credentials=secrets.aws_credentials(),
        aws_region=aws_region,
    )
    await instrument(
        instrument_thumbnails_endpoint(request, thumbnails, app_user.tenant)
    )
    return orjson_serialize(thumbnails)


@thumbnail_router.post(
    "/most_recent_thumbnail_enlarged", response_model=dict[str, ThumbnailResponse]
)
async def retrieve_most_recent_thumbnail_enlarged(
    request: Request,
    camera_mac_addresses: list[str],
    db: database.Database = Depends(get_backend_database),
    value_store: ValueStore = Depends(get_value_store),
    aws_region: str = Depends(get_aws_region),
    secrets: BackendSecrets = Depends(get_backend_secrets),
    app_user: auth_models.AppUser = Depends(auth.live_only_user_role_guard),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
) -> Response:
    async with db.tenant_session() as session:
        camera_mac_addresses = await filter_cameras_by_access(
            session, access, camera_mac_addresses
        )
        thumbnails = await get_most_recent_thumbnails(
            value_store,
            [
                ThumbnailKey(
                    camera_mac_address=mac_address,
                    thumbnail_type=models.ThumbnailType.TIMELAPSE,
                )
                for mac_address in camera_mac_addresses
            ],
        )

    sign_thumbnails(
        thumbnails=thumbnails.values(),
        aws_credentials=secrets.aws_credentials(),
        aws_region=aws_region,
    )
    await instrument(
        instrument_thumbnails_endpoint(request, thumbnails, app_user.tenant)
    )
    return orjson_serialize(thumbnails)


def _create_timelapse_video(
    timelapse_images: list[TimelapseImageResponse],
    video_filename: Path,
    boto_session_maker: BotoSessionFn,
) -> None:
    """Download images from S3 and create a timelapse video.

    :param timelapse_images: the list of images to use in the timelapse video.
    :param video_filename: the filename of the video to create.
    :param boto_session: the boto session to use to download images from S3.
    """
    start_time = time.time()
    tmp_dir = tempfile.mkdtemp()
    boto_session = boto_session_maker()
    s3_client = boto_session.client("s3")

    local_filenames = []
    download_start_time = time.time()
    for i, timelapse_image in enumerate(timelapse_images):
        bucket, resource = parse_s3_path(
            timelapse_image.s3_path, remove_leading_slash_key=True
        )
        local_filename = os.path.join(tmp_dir, f"{i:06d}.jpg")
        # Download image from S3 to local storage
        # TODO: cache images locally
        try:
            s3_client.download_file(
                Bucket=bucket, Key=resource, Filename=local_filename
            )
        except ClientError as ex:
            logger.error(
                f"Failed to download {timelapse_image.s3_path=} "
                f"from S3 {bucket=} {resource=} with error: {ex}"
            )
            continue

        local_filenames.append(local_filename)
    download_duration = time.time() - download_start_time

    video_creation_start_time = time.time()
    # Create mp4 file
    tmp_mp4_filename = os.path.join(tmp_dir, "timelapse.mp4")
    ffmpeg.input(os.path.join(tmp_dir, "%06d.jpg"), framerate=10).output(
        tmp_mp4_filename, vf="pad=ceil(iw/2)*2:ceil(ih/2)*2", pix_fmt="yuv420p"
    ).run()
    shutil.move(tmp_mp4_filename, video_filename)
    shutil.rmtree(tmp_dir)
    video_creation_duration = time.time() - video_creation_start_time
    total_duration = time.time() - start_time
    logger.info(
        f"Timelapse video creation took {total_duration:.2f} seconds. "
        f"Download took {download_duration:.2f} seconds for "
        f"{len(local_filenames)} files. "
        f"Video creation took {video_creation_duration:.2f} seconds."
    )


@thumbnail_router.post("/timelapse")
async def timelapse(
    request: Request,
    timelapse_request: RequestTimelapse,
    db: database.Database = Depends(get_backend_database),
    boto_session_maker: BotoSessionFn = Depends(get_boto_session_maker),
    _app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
) -> str:
    """Generate a timelapse video for the given request.

    :param timelapse_request: the request for the timelapse video
    :param db: DB instance, defaults to Depends(get_backend_database)
    :raises fastapi.HTTPException: if no timelapse images are found
    :return: relative URL to the timelapse video
    """
    async with db.tenant_session() as session:
        await check_camera_access(
            session, access, [timelapse_request.camera_mac_address]
        )
        timelapse_images = await orm.Thumbnail.get_timelapse_images(
            session=session,
            camera_mac_address=timelapse_request.camera_mac_address,
            start_time=timelapse_request.start_time,
            end_time=timelapse_request.end_time,
        )
    if len(timelapse_images) == 0:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="No timelapse images found.",
        )

    start_time = timelapse_images[0].timestamp
    end_time = timelapse_images[-1].timestamp
    video_filename = (
        STATIC_CLIPS_PATH
        / f"{timelapse_request.camera_mac_address}_{start_time}_{end_time}.mp4"
    )
    if not video_filename.exists():
        await run_async(
            _create_timelapse_video,
            timelapse_images,
            video_filename,
            boto_session_maker,
        )

    return gen_url_for_clip_path(request, video_filename)
