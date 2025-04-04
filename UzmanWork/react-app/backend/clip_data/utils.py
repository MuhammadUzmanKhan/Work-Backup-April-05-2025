import asyncio
from datetime import timedelta

import aio_pika
from fastapi import HTTPException, status

from backend import message_queue, ws_utils
from backend.boto_utils import BotoIotDataClient
from backend.constants import CLIP_S3_UPLOAD_RETRY_WAIT_INTERVAL_S
from backend.database import database, orm
from backend.database.orm.orm_archive import ArchiveError
from backend.escapi import protocol_models
from backend.iot_core.utils import (
    CLIP_UPLOAD_IOT_QUEUE_FACTORY,
    send_msg_to_nvr_through_iot,
)
from backend.s3_utils import S3Path
from backend.utils import AwareDatetime


class ClipS3UploadError(BaseException):
    """"""


class ClipS3UploadNoResponseError(ClipS3UploadError):
    """"""


class ClipS3UploadWaitForDeletedClipDataError(ClipS3UploadError):
    """"""


async def _put_msg_to_queue_for_upload_request(
    request: protocol_models.RequestUploadBody,
    mq_connection: aio_pika.abc.AbstractRobustConnection,
    iot_data_client: BotoIotDataClient,
    use_iot_core: bool,
) -> None:
    if use_iot_core:
        iot_queue_settings = CLIP_UPLOAD_IOT_QUEUE_FACTORY(request.nvr_uuid)
        await send_msg_to_nvr_through_iot(
            iot_queue_settings, request.json(), iot_data_client
        )
    else:
        queue_settings = ws_utils.ON_DEMAND_STREAMING_QUEUE_FACTORY(request.nvr_uuid)
        await message_queue.publish_message(
            mq_connection=mq_connection, queue_settings=queue_settings, message=request
        )


def _get_num_upload_retries(
    video_duration: timedelta,
    average_upload_speed: float = 0.5,
    retries_scaling_factor: float = 20,
) -> int:
    """_summary_

    :param video_duration: the duration of the video to be uploaded.
    :param average_upload_speed: the average upload speed in sec per video duration,
    defaults to 0.5.
    :param retries_scaling_factor: the scaling factor for the number of retries,
    defaults to 2.
    :return: max number of retries for video upload.
    """
    # The maximum number of retries for the periodic wait interval is determined
    # based on the observation that a video with a duration of 1 second typically
    # takes around 100~200 ms to upload. By setting the max retries appropriately,
    # we aim to ensure that in most cases, only half of the max retries iterations
    # are needed to wait for the response from the s3_path to be received.
    return max(
        int(
            (
                video_duration.total_seconds()
                * average_upload_speed
                * retries_scaling_factor
            )
            / CLIP_S3_UPLOAD_RETRY_WAIT_INTERVAL_S
        ),
        10,
    )


async def _wait_for_s3_clip_upload_response(
    clip_data_id: int, max_s3_upload_retries: int, db: database.Database
) -> protocol_models.UserClipUploadResponse:
    """Given the clip_data_id, wait for the s3_path response from the database.
    The number of retries is determined by the duration of the video to be uploaded.
    Raise error if the response is not received in time.
    """
    s3_upload_response = None

    # Wait for the s3_path response from the upload_request.clip_data_id
    for _ in range(max_s3_upload_retries):
        async with db.session() as session:
            clip_data = await orm.ClipData.system_get_clip_data_by_id(
                session, clip_data_id
            )

            if clip_data is None:
                # The clip_data is not found in the database, the
                # clip_data might have been deleted.
                raise ClipS3UploadWaitForDeletedClipDataError(
                    f"The clip_data_id {clip_data_id} can not be found anymore in the "
                    "database yet still waiting for the s3_path response."
                )

            if clip_data.s3_path is not None:
                s3_upload_response = protocol_models.UserClipUploadResponse(
                    clip_id=str(clip_data_id), s3_path=S3Path(clip_data.s3_path)
                )
                break

        await asyncio.sleep(CLIP_S3_UPLOAD_RETRY_WAIT_INTERVAL_S)

    # TODO: what notification we should send to frontend (for generating hints
    # to the user to request the upload again manually) and backend (for alert)?
    if s3_upload_response is None:
        # s3 upload was requested but the s3 path response was not found in
        # the database and timeout.
        raise ClipS3UploadNoResponseError(
            f"After {max_s3_upload_retries} retries, "
            f"the s3 path response for {clip_data_id=} "
            "still not found in the database."
        )
    return s3_upload_response


async def check_for_s3_clip_upload_response(
    clip_id: int,
    start_time: AwareDatetime,
    end_time: AwareDatetime,
    db: database.Database,
) -> protocol_models.UserClipUploadResponse:
    upload_video_duration = end_time - start_time
    max_s3_upload_retries = _get_num_upload_retries(upload_video_duration)
    return await _wait_for_s3_clip_upload_response(clip_id, max_s3_upload_retries, db)


async def request_s3_clip_upload(
    mq_connection: aio_pika.abc.AbstractRobustConnection,
    iot_data_client: BotoIotDataClient,
    upload_request: protocol_models.RequestUploadBody,
    use_iot_core: bool,
) -> None:
    # Enqueue a message to tell the edge to upload the clip
    await _put_msg_to_queue_for_upload_request(
        request=upload_request,
        mq_connection=mq_connection,
        iot_data_client=iot_data_client,
        use_iot_core=use_iot_core,
    )


async def request_and_wait_s3_clip_upload(
    db: database.Database,
    mq_connection: aio_pika.abc.AbstractRobustConnection,
    iot_data_client: BotoIotDataClient,
    upload_request: protocol_models.RequestUploadBody,
    use_iot_core: bool,
) -> protocol_models.UserClipUploadResponse:
    # Enqueue a message to tell the edge to upload the clip
    await request_s3_clip_upload(
        mq_connection, iot_data_client, upload_request, use_iot_core
    )
    return await check_for_s3_clip_upload_response(
        int(upload_request.clip_data_id),
        upload_request.start_time,
        upload_request.end_time,
        db,
    )


async def link_clip_data_to_archive(
    clip_id: int, archive_id: int, db: database.Database, user_email: str
) -> None:
    async with db.tenant_session() as session:
        clip_data = await orm.orm_clip_data.ClipData.get_clip_data_by_id(
            session, clip_id
        )
        if clip_data is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Clip data not found in database",
            )
        try:
            await orm.Archive.add_clip_to_archive(
                session, archive_id, clip_data, user_email
            )
        except ArchiveError as ex:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ex))
