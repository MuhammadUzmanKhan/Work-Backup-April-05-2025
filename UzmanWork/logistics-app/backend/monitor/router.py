import fastapi
import sqlalchemy as sa
from fastapi import APIRouter, Depends
from fastapi.encoders import jsonable_encoder

from backend import auth, auth_models
from backend.database import database
from backend.dependencies import get_backend_database
from backend.fastapi_utils import WithResponseExcludeNone
from backend.models import AccessRestrictions
from backend.monitor.alert import AlertNVR, AlertSeverity
from backend.monitor.alert_types import AlertType
from backend.monitor.models import VideoAlertRequest, VideoType
from backend.router_utils import get_camera_response_from_mac_address_or_fail
from backend.task_worker.background_task import send_slack_alert

monitor_router = WithResponseExcludeNone(
    APIRouter(
        prefix="/monitor",
        tags=["monitor"],
        generate_unique_id_function=lambda route: route.name,
    )
)


@monitor_router.post("/video_stream_alert")
async def video_stream_alert(
    video_alert_request: VideoAlertRequest,
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.live_only_user_role_guard),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
) -> None:
    """Send an alert that a video stream couldn't be loaded.

    :param video_alert_request: The video alert request

    :raises fastapi.HTTPException: HTTP 400 error is raised if the camera is not
    found or the user doesn't have permission to send alerts for the camera.
    """

    if video_alert_request.video_type == VideoType.LIVE:
        alert_type = AlertType.FRONTEND_LIVE_STREAM_DOWN
    elif video_alert_request.video_type == VideoType.CLIP:
        alert_type = AlertType.FRONTEND_CLIP_DOWN
    else:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=f"Unexpected video type: {video_alert_request.video_type}",
        )

    async with db.tenant_session() as session:
        camera_response = await get_camera_response_from_mac_address_or_fail(
            session, access, mac_address=video_alert_request.mac_address
        )

    if camera_response.camera.is_faulty:
        # Don't send alerts for faulty cameras
        return

    alert = AlertNVR(
        alert_type=alert_type,
        alert_severity=AlertSeverity.INFO,
        nvr_uuid=camera_response.camera.nvr_uuid,
        org_name=camera_response.org_name,
        detailed_info=video_alert_request.to_alert_detailed_info()
        | {
            "organization": camera_response.org_name,
            "nvr_uuid": camera_response.camera.nvr_uuid,
        },
    )
    # Send the alert through celery to avoid blocking the request
    send_slack_alert.delay(jsonable_encoder(alert))


@monitor_router.get("/backend_health")
async def backend_health() -> None:
    return


@monitor_router.get("/db_health")
async def db_health(db: database.Database = Depends(get_backend_database)) -> None:
    async with db.session() as session:
        await session.execute(sa.select(sa.literal(1)))
