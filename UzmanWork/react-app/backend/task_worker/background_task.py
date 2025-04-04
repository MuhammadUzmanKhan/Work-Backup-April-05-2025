import asyncio
import logging
from typing import Any

from backend import logging_config
from backend.alert.alert_models import (
    FaceAlertsSendRequest,
    LicensePlateAlertsSendRequest,
)
from backend.alert.tasks import send_alerts_notifications
from backend.clip_data.models import ClipArchiveRequest
from backend.clip_data.tasks import (
    ArchiveClipError,
    archive_thumbnails,
    ensure_clip_is_archived,
)
from backend.database import orm
from backend.db_utils import get_org_name_or_unknown
from backend.dependencies import (
    get_aws_region,
    get_backend_database,
    get_backend_envs,
    get_backend_secrets,
    get_boto_session_maker,
    get_email_client,
    get_iot_data_client,
    get_mq_connection,
    get_slack_client,
    get_sms_client,
    get_value_store,
)
from backend.face.constants import FACE_UPLOAD_RESPONSE_WAIT_INTERVAL_S
from backend.face.face_upload_utils import FaceUploadError
from backend.face.models import FaceUploadProcessData, NVRUniqueFaceNotificationData
from backend.face.tasks import notify_nvrs_on_unique_faces, send_upload_face_to_nvr
from backend.iot_core.db_utils import IOTCoreFeature, is_iot_core_feature_enabled
from backend.monitor.alert import AlertNVR, AlertSeverity
from backend.monitor.alert_types import AlertType
from backend.slack_client import send_slack_alert_for_errors
from backend.task_worker.celery_instance import celery_app
from backend.task_worker.errors import TaskExecutionError
from backend.task_worker.utils import async_task

logger = logging.getLogger(logging_config.LOGGER_NAME)

logger = logging.getLogger(logging_config.LOGGER_NAME)


@celery_app.task()
@async_task()
async def send_slack_alert(alert_request: dict[str, Any]) -> None:
    """
    This task is used to send slack alert.
    """
    slack_client = get_slack_client()

    await slack_client.send_alert(AlertNVR.parse_obj(alert_request))


@celery_app.task()
@async_task(
    alert_type_on_fail=AlertType.NOTIFICATION_TASK_FAILED,
    alert_severity_on_fail=AlertSeverity.WARNING,
)
async def send_face_alerts(face_alerts_request_raw: dict[str, Any]) -> None:
    db = get_backend_database()
    backend_envs = get_backend_envs()
    value_store = get_value_store()
    email_client = get_email_client()
    sms_client = get_sms_client()
    slack_client = get_slack_client()

    alerts_request = FaceAlertsSendRequest.parse_obj(face_alerts_request_raw)
    errors = await send_alerts_notifications(
        alerts_request,
        db,
        email_client,
        sms_client,
        slack_client,
        value_store,
        backend_envs.web_app_url,
    )
    if errors:
        await send_slack_alert_for_errors(
            errors=errors,
            alert_type=AlertType.ALERTS_NOTIFICATION_FAILED,
            alert_severity=AlertSeverity.WARNING,
            slack_client=slack_client,
            resource_description="face alerts notifications",
            org_name=await get_org_name_or_unknown(db, alerts_request.tenant),
        )


@celery_app.task()
@async_task(
    alert_type_on_fail=AlertType.NOTIFICATION_TASK_FAILED,
    alert_severity_on_fail=AlertSeverity.WARNING,
)
async def send_license_plate_alerts(
    license_plate_alerts_request_raw: dict[str, Any],
) -> None:
    db = get_backend_database()
    backend_envs = get_backend_envs()
    value_store = get_value_store()
    email_client = get_email_client()
    sms_client = get_sms_client()
    slack_client = get_slack_client()

    alerts_request = LicensePlateAlertsSendRequest.parse_obj(
        license_plate_alerts_request_raw
    )
    errors = await send_alerts_notifications(
        alerts_request,
        db,
        email_client,
        sms_client,
        slack_client,
        value_store,
        backend_envs.web_app_url,
    )
    if errors:
        await send_slack_alert_for_errors(
            errors=errors,
            alert_type=AlertType.ALERTS_NOTIFICATION_FAILED,
            alert_severity=AlertSeverity.WARNING,
            slack_client=slack_client,
            resource_description="license plate alerts notifications",
            org_name=await get_org_name_or_unknown(db, alerts_request.tenant),
        )
    if len(errors) == len(alerts_request.alert_occurrences):
        raise TaskExecutionError("All license plate alerts failed to notify.")


@celery_app.task(max_retries=5, autoretry_for=(ArchiveClipError,))
@async_task(
    retry_exc_type=ArchiveClipError,
    alert_type_on_fail=AlertType.ARCHIVE_CLIP_UPLOAD_FAILED,
    alert_severity_on_fail=AlertSeverity.ERROR,
)
async def ensure_clip_is_archived_task(clip_request_raw: str) -> None:
    clip_request = ClipArchiveRequest.parse_raw(clip_request_raw)
    db = get_backend_database()
    mq_connection = get_mq_connection()
    iot_data_client = get_iot_data_client()
    use_iot_core = await is_iot_core_feature_enabled(
        db, IOTCoreFeature.VIDEO, clip_request.tenant
    )
    await ensure_clip_is_archived(
        clip_request, db, mq_connection, iot_data_client, use_iot_core
    )


@celery_app.task()
@async_task(
    alert_type_on_fail=AlertType.ARCHIVE_CLIP_UPLOAD_FAILED,
    alert_severity_on_fail=AlertSeverity.WARNING,
)
async def archive_thumbnails_task(clip_request_raw: str) -> None:
    envs = get_backend_envs()
    clip_request = ClipArchiveRequest.parse_raw(clip_request_raw)
    db = get_backend_database()
    boto_session_maker = get_boto_session_maker()
    await archive_thumbnails(
        envs.environment_name, clip_request, db, boto_session_maker
    )


@celery_app.task(max_retries=720, autoretry_for=(FaceUploadError,))
@async_task(
    retry_exc_type=FaceUploadError,
    alert_type_on_fail=AlertType.FACE_UPLOAD_NVR_PROCESS_FAILED,
)
async def ensure_uploaded_face_has_been_processed_task(face_data_raw: str) -> None:
    """This task is invoked when a new clip is added to an archive."""
    face_data = FaceUploadProcessData.parse_raw(face_data_raw)
    db = get_backend_database()
    iot_data_client = get_iot_data_client()
    secrets = get_backend_secrets()
    region = get_aws_region()

    await send_upload_face_to_nvr(
        db, iot_data_client, face_data, secrets.aws_credentials(), region
    )
    # give the NVR some time to process the face
    await asyncio.sleep(FACE_UPLOAD_RESPONSE_WAIT_INTERVAL_S)
    # check if we have a unique face in the DB pointing to the uploaded face
    # org unique face id
    async with db.tenant_session(face_data.tenant) as session:
        if await orm.NVRUniqueFace.does_org_face_have_nvr_face(
            session, face_data.org_unique_face_id
        ):
            return

    raise FaceUploadError(f"Face {face_data=} has not been processed in time")


@celery_app.task()
@async_task()
async def on_nvrs_unique_face_notification_task(notification_data_raw: str) -> None:
    notification_data = NVRUniqueFaceNotificationData.parse_raw(notification_data_raw)
    iot_data_client = get_iot_data_client()
    await notify_nvrs_on_unique_faces(notification_data, iot_data_client)
