from datetime import timedelta

import fastapi
from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder

from backend import auth, auth_models
from backend.constants import (
    CAMERA_PIPELINE_ALERT_VALIDATION_TIMEOUT,
    UNASSIGNED_TENANT,
)
from backend.database import camera_models, database, orm
from backend.database.models import CamerasQueryConfig, NVRCreate
from backend.dependencies import get_backend_database, get_value_store
from backend.instrumentation.utils import instrument
from backend.models import AccessRestrictions, CameraResponse, InternetStatus
from backend.monitor import utils
from backend.monitor.alert import AlertNVR, EdgeCameraAlertRequest, NvrAlertData
from backend.monitor.models import (
    CameraPipelineAlertCreate,
    CameraPipelineAlertRequest,
    EdgeStatusUpdateCreate,
    EdgeStatusUpdateRequest,
    HeartbeatRequest,
    InternetStatusRequest,
    TimezoneUpdate,
)
from backend.monitor.utils import update_nvr_kvs_connection_status
from backend.router_utils import get_nvr_response_from_uuid_or_fail
from backend.task_worker.background_task import send_slack_alert
from backend.utils import AwareDatetime
from backend.value_store.value_store import (
    ValueStore,
    get_camera_pipeline_alert_key,
    get_edge_status_update_key,
    get_nvr_last_internet_status_key,
    get_recent_camera_pipeline_alerts_key,
)

monitor_router_edge = APIRouter(
    prefix="/monitor",
    tags=["monitor"],
    generate_unique_id_function=lambda route: route.name,
)


async def _get_cam_response_from_edge_request_or_fail(
    db: database.Database, mac_address: str, nvr_uuid: str
) -> CameraResponse:
    async with db.tenant_session() as session:
        camera_responses = await orm.Camera.get_cameras(
            session,
            query_config=CamerasQueryConfig(
                mac_addresses={mac_address}, nvr_uuids={nvr_uuid}
            ),
        )
        if len(camera_responses) != 1:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail="Camera not found.",
            )

        return camera_responses[0]


@monitor_router_edge.get("/edge_health")
async def edge_health() -> None:
    return


@monitor_router_edge.post("/edge_camera_alert")
async def edge_camera_alert(
    edge_alert_request: EdgeCameraAlertRequest,
    db: database.Database = Depends(get_backend_database),
    edge_user: auth_models.EdgeUser = Depends(auth.edge_user_role_guard),
) -> None:
    # If this is not a camera specific alert
    if isinstance(edge_alert_request.alert_data, NvrAlertData):
        nvr_uuid = edge_user.user_uuid
        async with db.tenant_session() as session:
            nvr = await get_nvr_response_from_uuid_or_fail(
                session, AccessRestrictions(), nvr_uuid
            )

        # Send the alert through celery to avoid blocking the request
        send_slack_alert.delay(
            jsonable_encoder(
                AlertNVR.from_edge_nvr_alert(
                    edge_alert_request.alert_data, nvr_uuid, nvr.org_name
                )
            )
        )
        return

    # If this is a camera specific alert
    camera_response = await _get_cam_response_from_edge_request_or_fail(
        db=db,
        mac_address=edge_alert_request.alert_data.camera_mac_address,
        nvr_uuid=edge_user.user_uuid,
    )

    if camera_response.camera.is_faulty:
        # Don't send alerts for faulty cameras
        return

    # Send the alert through celery to avoid blocking the request
    send_slack_alert.delay(
        jsonable_encoder(
            AlertNVR.from_edge_camera_alert(
                edge_alert_request.alert_data, camera_response
            )
        )
    )


@monitor_router_edge.post("/camera_pipeline_alert")
async def camera_pipeline_alert(
    camera_alert_request: CameraPipelineAlertRequest,
    db: database.Database = Depends(get_backend_database),
    value_store: ValueStore = Depends(get_value_store),
    edge_user: auth_models.EdgeUser = Depends(auth.edge_user_role_guard),
) -> None:
    mac_address = camera_alert_request.camera_mac_address

    async with db.tenant_session() as session:
        has_camera = await orm.Camera.nvr_has_mac_addresses(
            session, edge_user.user_uuid, {mac_address}
        )
    if not has_camera:
        raise HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=f"Camera with {mac_address=} not found.",
        )

    # Get the redis key for the camera pipeline alert
    alert_key = get_camera_pipeline_alert_key(mac_address)

    # Store the current alert in redis
    curr_alert = CameraPipelineAlertCreate(
        alert_type=camera_alert_request.alert_type,
        time_generated=camera_alert_request.time_generated,
        camera_mac_address=mac_address,
        alert_source=camera_alert_request.alert_source,
        alert_details=camera_alert_request.alert_details,
        nvr_uuid=edge_user.user_uuid,
    )
    await value_store.set_model(key=alert_key, model=curr_alert)

    await value_store.hset_model(
        key=get_recent_camera_pipeline_alerts_key(mac_address),
        mapping_key=camera_alert_request.alert_type,
        model=curr_alert,
    )


@monitor_router_edge.post("/edge_status_update")
async def edge_status_update(
    edge_status_update_request: EdgeStatusUpdateRequest,
    db: database.Database = Depends(get_backend_database),
    value_store: ValueStore = Depends(get_value_store),
    edge_user: auth_models.EdgeUser = Depends(auth.edge_user_role_guard),
) -> None:
    # Get the redis key for the edge status alert
    update_key = get_edge_status_update_key(edge_user.user_uuid)

    # Store the current alert in redis
    curr_update = EdgeStatusUpdateCreate(
        type=edge_status_update_request.type,
        time_generated=edge_status_update_request.time_generated,
        source=edge_status_update_request.source,
        details=edge_status_update_request.details,
        nvr_uuid=edge_user.user_uuid,
    )
    await value_store.set_model(key=update_key, model=curr_update)


@monitor_router_edge.post("/nvr_heartbeat")
async def nvr_heartbeat(
    heartbeat_request: HeartbeatRequest,
    db: database.Database = Depends(get_backend_database),
    edge_user_no_tenant: auth_models.EdgeUserNoTenant = Depends(
        auth.edge_user_no_tenant_role_guard
    ),
    value_store: ValueStore = Depends(get_value_store),
) -> None:
    nvr_uuid = heartbeat_request.nvr_uuid
    if nvr_uuid != edge_user_no_tenant.user_uuid:
        raise HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Received heartbeat for NVR {nvr_uuid}, "
                f"expected {edge_user_no_tenant.user_uuid}"
            ),
        )

    current_time = AwareDatetime.utcnow()

    async with db.session() as session:
        # if the NVR is not in the database, it's the first time it's sending a
        # heartbeat, so we add it to the database with the default tenant
        nvr = await orm.NVR.system_get_nvr_by_uuid(session, nvr_uuid)
        if not nvr:
            await orm.NVR.system_new_nvr(session, NVRCreate(uuid=nvr_uuid))
            return

        if heartbeat_request.nvr_info:
            await orm.NVR.system_update_nvr_last_seen_and_info(
                session,
                nvr_uuid=nvr_uuid,
                last_seen_time=current_time,
                nvr_info=heartbeat_request.nvr_info,
            )
        else:
            # this is left for backwards compatibility with old NVRs that don't send
            # the nvr_info field
            await orm.NVR.system_update_nvr_last_seen(session, nvr_uuid, current_time)

    # if the NVR is not assigned to an Organisation, we skip any further processing
    # until it's assigned to an Organisation (tenant)
    if nvr.tenant == UNASSIGNED_TENANT:
        return

    await update_nvr_kvs_connection_status(
        nvr_uuid, heartbeat_request.nvr_kvs_connection_status, value_store
    )

    online_camera_mac_addresses = set()
    stream_details = heartbeat_request.camera_stream_details

    if stream_details is not None:
        for detail in stream_details:
            online_camera_mac_addresses.add(detail.mac_address)
    else:
        if heartbeat_request.camera_mac_addresses is None:
            raise HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail=f"Received None addresses for NvrHeartbeat message  {nvr_uuid}.",
            )
        online_camera_mac_addresses = heartbeat_request.camera_mac_addresses

    # for the rest of the function, we use the tenant-scoped session and assume that NVR
    # is assigned to an Organization
    async with db.tenant_session(tenant=nvr.tenant) as session:
        # TODO (@slava) remove if when all NVRs start sending camera_stream_details
        if stream_details is not None:
            await orm.Camera.update_cameras_stream_details(
                session,
                updates=[
                    camera_models.UpdateCameraStreamDetails(
                        mac_address=detail.mac_address,
                        width=detail.width,
                        height=detail.height,
                        fps=round(detail.fps),
                        bitrate_kbps=round(detail.bitrate_kbps),
                        codec=detail.codec,
                        last_seen_time=current_time,
                    )
                    for detail in stream_details
                ],
            )
        else:
            await orm.Camera.update_cameras_last_seen_time(
                session, online_camera_mac_addresses, current_time
            )

        if heartbeat_request.camera_heartbeats is None:
            # Legacy NVR logic sends only one single heartbeat in each payload
            await utils.update_cameras_downtime(
                session=session,
                nvr_uuid=nvr.uuid,
                online_camera_mac_addresses=online_camera_mac_addresses,
                current_time=current_time,
            )
        else:
            # New logic send N>=1 heartbeats in one payload
            try:
                await utils.batch_update_cameras_downtime(
                    session=session,
                    nvr_uuid=nvr_uuid,
                    batch_update_request=heartbeat_request.camera_heartbeats,
                )
            except utils.MergeCameraHeartbeatsInputError as e:
                raise HTTPException(
                    status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Error batch updating camera downtime for NVR {nvr_uuid}: {e}"
                    ),
                )

    # Get camera pipeline alerts that have been stored in redis and they have camera
    # mac addresses that received a heartbeat
    alerts = await value_store.get_multiple_models(
        keys=[
            get_camera_pipeline_alert_key(mac) for mac in online_camera_mac_addresses
        ],
        model_class=CameraPipelineAlertCreate,
    )

    # Check if any of the alerts have been resolved
    alert_to_delete_keys = []
    for key, alert in alerts.items():
        if alert is None:
            continue
        # Only delete alerts that have age more than the specified timeout, keep recent
        # alerts because it might be still valid due to delay in heartbeat request
        # compared to alert request.
        if (
            current_time - alert.time_generated
            > CAMERA_PIPELINE_ALERT_VALIDATION_TIMEOUT
        ):
            alert_to_delete_keys.append(key)

    # Delete camera pipeline alerts that have been resolved
    await value_store.del_model(
        keys=alert_to_delete_keys, model_class=CameraPipelineAlertCreate
    )


@monitor_router_edge.post("/update_timezone")
async def update_timezone(
    timezone_update: TimezoneUpdate,
    db: database.Database = Depends(get_backend_database),
    edge_user: auth_models.EdgeUser = Depends(auth.edge_user_role_guard),
) -> None:
    nvr_uuid = timezone_update.nvr_uuid
    if nvr_uuid != edge_user.user_uuid:
        raise HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Received timezone update for NVR {nvr_uuid}, "
                f"expected {edge_user.user_uuid}"
            ),
        )

    async with db.tenant_session() as session:
        await orm.NVR.update_nvr_timezone(session, nvr_uuid, timezone_update.timezone)

        location = await orm.Location.get_location_by_nvr(session, nvr_uuid)
        if (
            location
            and not location.enable_setting_timezone
            and location.timezone != timezone_update.timezone
        ):
            location.timezone = timezone_update.timezone


@monitor_router_edge.post("/internet_status")
async def internet_status(
    status_request: InternetStatusRequest,
    value_store: ValueStore = Depends(get_value_store),
    edge_user: auth_models.EdgeUser = Depends(auth.edge_user_role_guard),
) -> None:
    if status_request.nvr_uuid != edge_user.user_uuid:
        raise HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Received heartbeat for NVR {status_request.nvr_uuid}, "
                f"expected {edge_user.user_uuid}"
            ),
        )

    await value_store.set_model(
        key=get_nvr_last_internet_status_key(status_request.nvr_uuid),
        model=InternetStatus(
            timestamp=(
                AwareDatetime.utcnow()
                if status_request.timestamp is None
                else status_request.timestamp
            ),
            domain=status_request.domain,
            avg_ping_latency_ms=status_request.avg_ping_latency_ms,
            packet_loss=status_request.packet_loss,
            internet_speed=status_request.internet_speed,
        ),
        expiration=timedelta(hours=2),
    )

    await instrument(utils.instrument_nvr_internet_status(status_request))
