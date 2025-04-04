import aio_pika
from fastapi import APIRouter, Depends, HTTPException, WebSocket, status

from backend import auth, auth_models, dependencies, envs, ws_utils
from backend.auth_models import AwsCognitoClient
from backend.database import database, models, orm
from backend.dependencies import get_backend_database, get_value_store
from backend.organization_feature_flags.utils import (
    get_org_features_or_fail,
    get_org_or_fail,
)
from backend.stream_discovery import protocol_models
from backend.stream_discovery.constants import CACHE_DISCOVERY_EXPIRATION
from backend.stream_discovery.models import (
    DiscoveryCachedEntry,
    DiscoveryRequest,
    NvrStatusResponse,
)
from backend.stream_discovery.utils import (
    generate_camera_statuses,
    get_mac_addresses_require_ip_update,
    get_mac_addresses_require_rtsp_port_update,
    get_nvr_cameras_or_fail,
)
from backend.value_store.value_store import ValueStore, get_nvr_discovery_key

# TODO(@lberg): rename file to router_edge
stream_discovery_router_edge = APIRouter(
    prefix="/stream_discovery",
    tags=["stream_discovery"],
    generate_unique_id_function=lambda route: route.name,
)


@stream_discovery_router_edge.post("/upload")
async def upload_discovery(
    discovery_request: DiscoveryRequest,
    db: database.Database = Depends(get_backend_database),
    edge_user: auth_models.EdgeUser = Depends(auth.edge_user_role_guard),
    value_store: ValueStore = Depends(get_value_store),
) -> None:
    """Process a discovery request sent from an edge device.
    Store the discovered cameras in redis and update IPs for existing cameras.
    """
    mac_address_to_camera = discovery_request.mac_address_to_camera()
    nvr_uuid = discovery_request.nvr_uuid

    if nvr_uuid != edge_user.user_uuid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"nvr_uuid {nvr_uuid} does not match edge user {edge_user.user_uuid}"
            ),
        )

    # update the max camera slots for the nvr
    async with db.tenant_session() as session:
        await orm.NVR.update_nvr_max_cameras_slots(
            session, nvr_uuid, discovery_request.nvr_capabilities.max_num_cameras()
        )

    async with db.tenant_session() as session:
        _, nvr_cameras = await get_nvr_cameras_or_fail(session, nvr_uuid)

    macs_to_update_ip = get_mac_addresses_require_ip_update(
        mac_address_to_camera, nvr_cameras
    )
    if macs_to_update_ip:
        async with db.tenant_session() as session:
            await orm.Camera.update_cameras_ip_address(
                session,
                {
                    mac_address: mac_address_to_camera[mac_address].ip
                    for mac_address in macs_to_update_ip
                },
            )

    macs_to_update_rtsp_port = get_mac_addresses_require_rtsp_port_update(
        mac_address_to_camera, nvr_cameras
    )
    if macs_to_update_rtsp_port:
        async with db.tenant_session() as session:
            await orm.Camera.update_cameras_rtsp_port(
                session,
                {
                    mac_address: mac_address_to_camera[mac_address].rtsp_port
                    for mac_address in macs_to_update_rtsp_port
                },
            )

    # compose a cache based on previous discovery and the new discovery
    stored_cached_discovery = await value_store.get_model(
        get_nvr_discovery_key(nvr_uuid), DiscoveryCachedEntry
    )
    cached_discovery: DiscoveryCachedEntry | None = None
    if stored_cached_discovery is None:
        cached_discovery = DiscoveryCachedEntry.from_discovery(discovery_request)
    else:
        cached_discovery = stored_cached_discovery
        cached_discovery.update_from_discovery(discovery_request)

    # Add the discovery to redis
    await value_store.set_model(
        get_nvr_discovery_key(nvr_uuid),
        cached_discovery,
        expiration=CACHE_DISCOVERY_EXPIRATION,
    )


@stream_discovery_router_edge.get("/status/{nvr_uuid}")
async def retrieve_nvr_status(
    nvr_uuid: str,
    db: database.Database = Depends(get_backend_database),
    edge_user: auth_models.EdgeUser = Depends(auth.edge_user_role_guard),
) -> NvrStatusResponse:
    """Retrieve the status of the NVR and the cameras assigned to it."""

    if nvr_uuid != edge_user.user_uuid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"{nvr_uuid=} does not match {edge_user.user_uuid=}",
        )

    async with db.tenant_session() as session:
        org = await get_org_or_fail(session)
        org_features = await get_org_features_or_fail(session)
        network_scan_settings = await orm.Organization.get_network_scan_settings(
            session
        )
        if network_scan_settings is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Network scan settings not found for {org=} {nvr_uuid=}",
            )

    async with db.tenant_session() as session:
        nvr, nvr_cameras = await get_nvr_cameras_or_fail(session, nvr_uuid)
        cameras_accepted = await generate_camera_statuses(
            session=session,
            cameras=[
                camera.camera for camera in nvr_cameras if camera.camera.is_enabled
            ],
            org_features=org_features,
        )
        is_face_recognition_enabled = models.FeatureFlags.FACE_ENABLED in org_features

    return NvrStatusResponse(
        cameras_enabled=cameras_accepted,
        mac_addresses_disabled=[
            camera.camera.mac_address
            for camera in nvr_cameras
            if not camera.camera.is_enabled
        ],
        is_face_recognition_enabled=is_face_recognition_enabled,
        retention_days=nvr.retention_days,
        low_res_bitrate_kbps=org.low_res_bitrate_kbps,
        network_scan_settings=network_scan_settings,
    )


@stream_discovery_router_edge.websocket("/sync")
async def websocket_endpoint(
    websocket: WebSocket,
    mq_connection: aio_pika.abc.AbstractRobustConnection = Depends(
        dependencies.get_mq_connection
    ),
    backend_envs: envs.BackendEnvs = Depends(dependencies.get_backend_envs),
    aws_cognito_client: AwsCognitoClient = Depends(dependencies.get_aws_cognito_client),
) -> None:
    """Websocket endpoint to send discovery requests to the NVR."""
    await ws_utils.connect_to_nvr(
        "camera_discovery",
        websocket,
        aws_cognito_client,
        ws_utils.DISCOVERY_QUEUE_FACTORY,
        backend_envs,
        mq_connection,
        protocol_models.DiscoveryMessageFrame,
        protocol_models.DiscoveryRequestBody,
    )
