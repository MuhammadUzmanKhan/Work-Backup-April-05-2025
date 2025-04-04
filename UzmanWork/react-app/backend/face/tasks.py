import asyncio
import logging

from backend import logging_config
from backend.aws_signer.aws_signer_models import AWSCredentials
from backend.boto_utils import BotoIotDataClient
from backend.database import database
from backend.face.face_upload_utils import pick_nvr_for_face_upload
from backend.face.models import (
    FaceUploadProcessData,
    NVRFaceImageProcessRequest,
    NVRUniqueFaceNotificationData,
)
from backend.face.protocol_models import RequiredUniqueFaceEdgeData, UniqueFaceShareBody
from backend.iot_core.utils import (
    UNIQUE_FACE_SHARE_IOT_QUEUE_FACTORY,
    UPLOADED_FACE_PROCESS_IOT_QUEUE_FACTORY,
    send_msg_to_nvr_through_iot,
)
from backend.s3_utils import RequestTime, get_signed_url
from backend.utils import AwareDatetime

logger = logging.getLogger(logging_config.LOGGER_NAME)


async def _enqueue_nvr_unique_face(
    message: UniqueFaceShareBody, nvr_uuid: str, iot_client: BotoIotDataClient
) -> None:
    iot_queue_settings = UNIQUE_FACE_SHARE_IOT_QUEUE_FACTORY(nvr_uuid)
    await send_msg_to_nvr_through_iot(iot_queue_settings, message.json(), iot_client)


async def notify_nvrs_on_unique_faces(
    notification_data: NVRUniqueFaceNotificationData, iot_data_client: BotoIotDataClient
) -> None:
    # Send the unique faces to all other NVRs
    for unique_face in notification_data.unique_faces:
        # TODO(@lberg): remove once all NVRs are updated
        if unique_face.track_embedding_data is None:
            logger.warn(
                f"Unique face {unique_face.unique_face_id} from"
                f" {notification_data.sender_nvr_uuid} is missing track embeddings."
                " This could be due to legacy code. Skipping."
            )
            continue

        message = UniqueFaceShareBody(
            sender_nvr_uuid=notification_data.sender_nvr_uuid,
            unique_face_data=RequiredUniqueFaceEdgeData(
                unique_face_id=unique_face.unique_face_id,
                s3_path=unique_face.s3_path,
                track_embedding_data=unique_face.track_embedding_data,
            ),
        )

        await asyncio.gather(
            *[
                _enqueue_nvr_unique_face(
                    message=message, nvr_uuid=nvr_uuid, iot_client=iot_data_client
                )
                for nvr_uuid in notification_data.recipient_nvr_uuids
            ]
        )


async def send_upload_face_to_nvr(
    db: database.Database,
    iot_data_client: BotoIotDataClient,
    face_data: FaceUploadProcessData,
    aws_credentials: AWSCredentials,
    aws_region: str,
) -> None:
    async with db.tenant_session(face_data.tenant) as session:
        face_register_nvr = await pick_nvr_for_face_upload(
            session, face_data.access_restrictions
        )
    nvr_uuid = face_register_nvr.uuid
    iot_queue_settings = UPLOADED_FACE_PROCESS_IOT_QUEUE_FACTORY(nvr_uuid)

    signed_url = get_signed_url(
        s3_path=face_data.face_s3_path,
        request_time=RequestTime.from_datetime(AwareDatetime.utcnow()),
        aws_credentials=aws_credentials,
        aws_region=aws_region,
    )
    logger.info(f"[FACE-UPLOAD-TASK] {face_data=}: sending to {nvr_uuid=}")
    await send_msg_to_nvr_through_iot(
        iot_queue_settings,
        NVRFaceImageProcessRequest(
            signed_url=signed_url, org_unique_face_id=face_data.org_unique_face_id
        ).json(),
        iot_data_client,
    )
