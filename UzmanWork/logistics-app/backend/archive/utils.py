import bisect
import logging
from datetime import timedelta

import aio_pika
from fastapi import HTTPException
from pydantic import AnyHttpUrl
from starlette.datastructures import URL

from backend import logging_config
from backend.archive.models import ArchiveCommentResponse, ArchiveResponse
from backend.boto_utils import BotoIotDataClient, BotoSessionFn
from backend.constants import ARCHIVE_VIDEO_STREAM_DATA_RETENTION
from backend.database import database, orm
from backend.database.models import ArchiveClipData, ArchiveComment, Camera, ClipData
from backend.database.session import TenantAwareAsyncSession
from backend.envs import EnvValue
from backend.escapi import protocol_models
from backend.kinesis_api.errors import KinesisError
from backend.kinesis_api.models import (
    KinesisArchivedVideoClipConfig,
    KinesisClipRetentionHoursUpdateRequest,
    KinesisStreamRequest,
    KinesisStreamRequestType,
    StaticResolutionConfig,
)
from backend.kinesis_api.utils import (
    clip_kinesis_retention_update_request,
    get_kinesis_clip_url,
    get_kinesis_clip_url_with_edge_upload,
)
from backend.sync_utils import run_async
from backend.utils import AwareDatetime
from backend.value_store import ValueStore

logger = logging.getLogger(logging_config.LOGGER_NAME)

# If a clip is created within 2 seconds of a comment, we consider the comment
# was posted together with the clip creation.
ATTACH_CLIP_TO_COMMENT_THRESHOLD_S = 2


async def get_user_archives(
    session: TenantAwareAsyncSession, user_email: str, valid_clips_only: bool
) -> list[ArchiveResponse]:
    """Helper function to collect all archives owned by user and shared with user
    and populate ArchiveResponse. If valid_clips_only is True, only return
    archives that contain at least one valid clip.
    """
    # Get archives owned by user
    archives_owned_by_user = [
        ArchiveResponse.from_orm(archive)
        for archive in await orm.Archive.get_archives_owned(session, user_email)
    ]
    # Get archives shared with user
    archives_shared_with_user = [
        ArchiveResponse.from_orm(archive)
        for archive in await orm.SharedArchive.get_archives_shared_with_user(
            session, user_email
        )
    ]

    enumerated_archives = archives_owned_by_user + archives_shared_with_user
    valid_archive_responses = []
    for archive in enumerated_archives:
        if len(archive.clips) == 0 and valid_clips_only:
            logging.warning(f"Archive {archive} contains no clip.")
        else:
            valid_archive_responses.append(archive)
    return valid_archive_responses


# TODO(@lberg): this function is huge and does a lot of things.
async def archive_request_kvs_if_not_exists(
    camera: Camera,
    clip_data: ClipData,
    kinesis_stream_request: KinesisStreamRequest,
    boto_session_maker: BotoSessionFn,
    iot_data_client: BotoIotDataClient,
    mq_connection: aio_pika.abc.AbstractRobustConnection,
    db: database.Database,
    value_store: ValueStore,
    master_playlist_redirect_url: URL,
    tenant: str,
    use_iot_core: bool,
) -> AnyHttpUrl:
    """When associating ClipData record to an archive, check if the kinesis stream
    exists. If not, request the kinesis stream and update the retention hours.
    """
    # If kvs_stream_name already exists, we don't need to upload the video again
    # bump up the kinesis stream's retention hours.
    # Use KinesisVideoClipRequestArchive for clip request:
    # Typically when user clicks on the archive button, the front end already has
    # the kinesis video clip request with random hash id, but to archive it, we
    # request the video to upload again to a fixed stream name, so when the user
    # revisits the archived video in Archive page, this fixed stream name will be
    # used to retrieve the video from kinesis.
    kinesis_video_clip_config = KinesisArchivedVideoClipConfig(
        stream_hash=camera.source,
        start_time=clip_data.start_time,
        end_time=clip_data.end_time,
        clip_id=clip_data.id,
        retention_period=kinesis_stream_request.retention_duration,
        resolution_config=StaticResolutionConfig(
            static_resolution=protocol_models.VideoResRequestType.High
        ),
    )

    kinesis_clip_url = None
    need_retention_update = False

    if clip_data.kvs_stream_name is None:
        # If kvs_stream_name not exists, request the stream with _shared suffix
        kinesis_clip_url = await get_kinesis_clip_url_with_edge_upload(
            master_playlist_redirect_url=master_playlist_redirect_url,
            camera=camera,
            clip_config=kinesis_video_clip_config,
            boto_session_maker=boto_session_maker,
            iot_data_client=iot_data_client,
            mq_connection=mq_connection,
            value_store=value_store,
            use_iot_core=use_iot_core,
        )
    else:
        if clip_data.expiration_time is None:
            raise KinesisError("ClipData has no expiration time")

        if clip_data.kvs_stream_name != kinesis_video_clip_config.upload_stream_name:
            logger.error(
                f"\nClip stream name {clip_data.kvs_stream_name} does not match with"
                f" {kinesis_video_clip_config.upload_stream_name}"
                "use the one stored in db."
            )
            kinesis_video_clip_config = (
                kinesis_video_clip_config.forward_using_stream_name(
                    clip_data.kvs_stream_name
                )
            )
        if clip_data.expiration_time < AwareDatetime.utcnow():
            # Clip already expired, request upload again.
            kinesis_clip_url = await get_kinesis_clip_url_with_edge_upload(
                master_playlist_redirect_url=master_playlist_redirect_url,
                camera=camera,
                clip_config=kinesis_video_clip_config,
                boto_session_maker=boto_session_maker,
                iot_data_client=iot_data_client,
                mq_connection=mq_connection,
                value_store=value_store,
                use_iot_core=use_iot_core,
            )
        else:
            # Clip not expired,
            kinesis_clip_url = await get_kinesis_clip_url(
                master_playlist_redirect_url=master_playlist_redirect_url,
                clip_params=kinesis_video_clip_config,
                boto_session_maker=boto_session_maker,
                value_store=value_store,
            )
            need_retention_update = True

    if (
        kinesis_stream_request.request_type == KinesisStreamRequestType.VIEW
        and clip_data.kvs_stream_name is not None
    ):
        # view only request and kvs stream is already there, no need to bump
        # up the retention hours and db record
        return kinesis_clip_url

    retention_duration = kinesis_stream_request.retention_duration
    clip_expiration_time = AwareDatetime.utcnow() + retention_duration
    # request update the kvs stream name's expiration date
    if need_retention_update:
        await run_async(
            clip_kinesis_retention_update_request,
            boto_session_maker,
            KinesisClipRetentionHoursUpdateRequest(
                kvs_stream_name=kinesis_video_clip_config.upload_stream_name,
                expiration_time=clip_expiration_time,
            ),
        )

    # Now we are sure the kinesis stream is created and the retention hours is set,
    # update the db record.
    async with db.tenant_session(tenant=tenant) as session:
        await orm.orm_clip_data.ClipData.update_clip_data_kvs_stream_by_id(
            session,
            clip_data.id,
            kinesis_video_clip_config.upload_stream_name,
            clip_expiration_time,
        )
    return kinesis_clip_url


def retrieve_comment_responses(
    comments: list[ArchiveComment], clips: list[ArchiveClipData]
) -> list[ArchiveCommentResponse]:
    """Retrieve comment responses for the given comments and clips.
    For clips, we assign them to the comment if the clip's creation time
    is close enough to the comment.
    """
    if len(comments) == 0:
        return []
    comments = sorted(comments, key=lambda comment: comment.creation_time)
    timestamps = [comment.creation_time for comment in comments]
    comment_responses = [
        ArchiveCommentResponse(comment=comment) for comment in comments
    ]
    for clip in clips:
        creation_time = clip.creation_time
        # Binary search returns the index of the first element that is >=
        # the creation time of the clip.
        index_after = bisect.bisect_left(timestamps, creation_time)
        for index in [index_after, index_after - 1]:
            if index < 0 or index >= len(timestamps):
                continue
            time_difference = abs((timestamps[index] - creation_time).total_seconds())
            if time_difference < ATTACH_CLIP_TO_COMMENT_THRESHOLD_S:
                comment_responses[index].attached_clip_data = clip
                break

    return comment_responses


async def check_user_can_access_archive(
    session: TenantAwareAsyncSession, user_email: str, archive_id: int
) -> None:
    """Helper function to check if the user owns the archive or the archive
    is shared with them.
    """
    if not await orm.Archive.user_owns_archive(
        session, archive_id, user_email
    ) and not await orm.SharedArchive.archive_is_shared_with_user(
        session, archive_id, user_email
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Archive with {archive_id=} does not exist or user has no access to it"
            ),
        )


async def check_user_can_access_archive_clip(
    session: TenantAwareAsyncSession, user_email: str, archive_id: int, clip_id: int
) -> None:
    """Helper function to check if the user has access to this clip.
    The check is done by checking:
    - if the user has access to the archive this clip belongs to.
    - if the clip is from the archive
    """
    await check_user_can_access_archive(session, user_email, archive_id)
    if not await orm.orm_archive.ArchiveClipData.archive_has_clip(
        session, archive_id, clip_id
    ):
        raise HTTPException(
            status_code=400, detail=f"{clip_id=} is not part of {archive_id=}"
        )


def get_archive_retention(environment_name: EnvValue) -> timedelta:
    if environment_name == "dev":
        return timedelta(days=30)
    return ARCHIVE_VIDEO_STREAM_DATA_RETENTION
