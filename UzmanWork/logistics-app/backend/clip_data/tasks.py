import logging
from pathlib import Path

import aio_pika
from botocore.exceptions import ClientError

from backend.boto_utils import BotoIotDataClient, BotoSessionFn
from backend.clip_data.constants import CLIPS_BUCKET
from backend.clip_data.models import ClipArchiveRequest
from backend.clip_data.utils import (
    ClipS3UploadError,
    check_for_s3_clip_upload_response,
    request_s3_clip_upload,
)
from backend.database import database, orm
from backend.database.models import ArchiveThumbnailCreate
from backend.envs import EnvValue
from backend.escapi.protocol_models import RequestUploadBody, VideoOverlayType
from backend.s3_utils import S3CopyError, S3Path, get_s3_client, s3_copy

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


class ArchiveThumbnailError(Exception):
    pass


class ArchiveThumbnailPathError(ArchiveThumbnailError):
    pass


class ArchiveThumbnailCopyError(ArchiveThumbnailError):
    pass


class ArchiveNoThumbnailFoundError(ArchiveThumbnailError):
    pass


class ArchiveClipError(Exception):
    pass


async def _archive_thumbnails(
    clip_request: ClipArchiveRequest,
    dst_bucket: str,
    dst_path: str,
    db: database.Database,
    boto_session_maker: BotoSessionFn,
) -> list[ArchiveThumbnailError]:
    """Ensure all the thumbnails of the clip are not deleted from s3 and the DB.
    Return a list of errors encountered during the archiving process.
    """
    async with db.tenant_session(tenant=clip_request.tenant) as session:
        thumbnails = await orm.orm_thumbnail.Thumbnail.get_all_thumbnails_in_time_range(
            session=session,
            camera_mac_address=clip_request.mac_address,
            start_time=clip_request.start_time,
            end_time=clip_request.end_time,
        )

    try:
        s3_client = await get_s3_client(boto_session_maker)
    except ClientError as ex:
        return [
            ArchiveThumbnailCopyError(
                f"Failed to create s3 client for archiving thumbnails: {ex}"
            )
        ]

    thumbnails_to_archive = []
    errors: list[ArchiveThumbnailError] = []

    if len(thumbnails) == 0:
        errors.append(ArchiveNoThumbnailFoundError("No thumbnails found to archive"))
        return errors

    # sequentially copy thumbnails to archive bucket
    for thumbnail in thumbnails:
        try:
            _, thumbnail_key = thumbnail.s3_path.bucket_and_key(True)
            archived_thumbnail_path = str(
                Path(dst_bucket) / dst_path / Path(thumbnail_key).name
            )
            archived_thumbnail_s3_path = S3Path("s3://" + str(archived_thumbnail_path))
        except ValueError as ex:
            errors.append(
                ArchiveThumbnailPathError(f"failed to parse thumbnail s3 path: {ex}")
            )
            continue
        try:
            await s3_copy(
                s3_client,
                src_path=thumbnail.s3_path,
                dst_path=archived_thumbnail_s3_path,
            )
            thumbnails_to_archive.append((thumbnail, archived_thumbnail_s3_path))

        except S3CopyError as ex:
            errors.append(
                ArchiveThumbnailCopyError(f"Failed to archive {thumbnail=} in S3: {ex}")
            )

    async with db.tenant_session(tenant=clip_request.tenant) as session:
        await orm.ArchivedThumbnail.add_archive_thumbnail_batch(
            session=session,
            clip_id=clip_request.clip_id,
            thumbnail_metadata_batch=[
                ArchiveThumbnailCreate(timestamp=thumbnail.timestamp, s3_path=s3_path)
                for thumbnail, s3_path in thumbnails_to_archive
            ],
        )

    return errors


async def ensure_clip_is_archived(
    clip_request: ClipArchiveRequest,
    db: database.Database,
    mq_connection: aio_pika.abc.AbstractRobustConnection,
    iot_data_client: BotoIotDataClient,
    use_iot_core: bool,
) -> None:
    # send a single message to the edge to upload the clip
    upload_request = RequestUploadBody(
        mac_address=clip_request.mac_address,
        start_time=clip_request.start_time,
        end_time=clip_request.end_time,
        clip_data_id=str(clip_request.clip_id),
        video_overlay_type=VideoOverlayType.LocalDateTime,
        nvr_uuid=clip_request.nvr_uuid,
        video_orientation_type=clip_request.video_orientation_type,
    )
    await request_s3_clip_upload(
        mq_connection, iot_data_client, upload_request, use_iot_core
    )

    try:
        await check_for_s3_clip_upload_response(
            clip_request.clip_id, clip_request.start_time, clip_request.end_time, db
        )
    except ClipS3UploadError as ex:
        raise ArchiveClipError(
            f"Failed to get s3 path for clip {clip_request.clip_id}: {ex}"
        )


async def archive_thumbnails(
    env_name: EnvValue,
    clip_request: ClipArchiveRequest,
    db: database.Database,
    boto_session_maker: BotoSessionFn,
) -> None:
    async with db.tenant_session(tenant=clip_request.tenant) as session:
        if await orm.ArchivedThumbnail.clip_has_archived_thumbnails(
            session, clip_request.clip_id
        ):
            return

    bucket = f"{CLIPS_BUCKET}-{env_name}"
    path = f"{clip_request.nvr_uuid}/archived_thumbnails/{clip_request.clip_id}/"

    # archive thumbnails for the clip
    thumbnail_errors = await _archive_thumbnails(
        clip_request, bucket, path, db, boto_session_maker
    )
    if len(thumbnail_errors) > 0:
        msg = "Failed to archive one or more thumbnails:" + "\n".join(
            [str(error) for error in thumbnail_errors]
        )
        raise ArchiveClipError(msg)
