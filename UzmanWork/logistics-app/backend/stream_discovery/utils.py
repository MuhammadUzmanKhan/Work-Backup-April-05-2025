import logging
import re
from ipaddress import IPv4Address

from fastapi import HTTPException, status

from backend import logging_config
from backend.constants import (
    DEFAULT_FORCE_VIDEO_CONFIG_FPS,
    REGEX_MAC_ADDRESS_SECONDARY_HEAD,
)
from backend.database import orm
from backend.database.models import NVR, Camera, CamerasQueryConfig, FeatureFlags
from backend.database.session import TenantAwareAsyncSession
from backend.models import AccessRestrictions, CameraResponse
from backend.stream_discovery.models import CameraDiscoveryResponse, DiscoveredCamera

logger = logging.getLogger(logging_config.LOGGER_NAME)


# TODO(@lberg): likely move this to a more general place
def parse_main_head_mac_address(mac_address: str) -> str:
    """Returns the main head mac address if the camera is a multi-head camera.
    Returns the input mac address if the camera is not a multi-head camera.
    """
    if re.match(REGEX_MAC_ADDRESS_SECONDARY_HEAD, mac_address):
        return mac_address.split("-")[0]
    return mac_address


async def generate_camera_statuses(
    session: TenantAwareAsyncSession,
    cameras: list[Camera],
    org_features: list[FeatureFlags],
) -> list[CameraDiscoveryResponse]:
    responses = []
    # For multi-head camera, use the credentials of the main head.
    # NOTE(@lberg): we do this here (and not at insertion time) because we want to
    # avoid having to update the credentials of all the cameras when the main head
    # changes.
    cameras_credentials = await orm.Camera.get_cameras_credentials(
        session, [parse_main_head_mac_address(camera.mac_address) for camera in cameras]
    )

    for camera in cameras:
        credentials = cameras_credentials.get(
            parse_main_head_mac_address(camera.mac_address)
        )
        if credentials is None:
            logger.error(f"Could not find credentials in database for {camera=}")
            continue
        is_license_plate_detection_enabled_for_org = (
            FeatureFlags.LICENSE_PLATE_RECOGNITION_ENABLED in org_features
        )

        responses.append(
            CameraDiscoveryResponse(
                mac_address=camera.mac_address,
                vendor=credentials.vendor,
                ip=IPv4Address(camera.ip),
                username=credentials.username,
                password=credentials.password,
                video_orientation_type=camera.video_orientation_type,
                is_always_streaming=camera.is_always_streaming,
                is_license_plate_detection_enabled=(
                    is_license_plate_detection_enabled_for_org
                    and camera.is_license_plate_detection_enabled
                ),
                is_audio_enabled=camera.is_audio_enabled,
                force_video_config_fps=(
                    DEFAULT_FORCE_VIDEO_CONFIG_FPS
                    if camera.is_force_fps_enabled
                    else None
                ),
                stream_hash=camera.source,
                rtsp_port=camera.rtsp_port,
                enforced_rtsp_url=camera.enforced_rtsp_url,
            )
        )

    return responses


async def get_nvr_cameras_or_fail(
    session: TenantAwareAsyncSession, nvr_uuid: str
) -> tuple[NVR, list[CameraResponse]]:
    nvr = await orm.NVR.get_nvr_by_uuid(session, nvr_uuid, AccessRestrictions())
    if nvr is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"nvr with {nvr_uuid=} not found",
        )
    if nvr.location_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"nvr with {nvr_uuid=} is not registered to a location",
        )
    # Get all cameras from the NVR
    nvr_cameras = await orm.Camera.get_cameras(
        session,
        query_config=CamerasQueryConfig(nvr_uuids={nvr_uuid}, exclude_disabled=False),
    )
    return (nvr, nvr_cameras)


def get_mac_addresses_require_ip_update(
    discovered_cameras: dict[str, DiscoveredCamera], db_cameras: list[CameraResponse]
) -> list[str]:
    return [
        camera.camera.mac_address
        for camera in db_cameras
        if camera.camera.mac_address in discovered_cameras
        and camera.camera.ip != discovered_cameras[camera.camera.mac_address].ip
    ]


def get_mac_addresses_require_rtsp_port_update(
    discovered_cameras: dict[str, DiscoveredCamera], db_cameras: list[CameraResponse]
) -> list[str]:
    return [
        camera.camera.mac_address
        for camera in db_cameras
        if camera.camera.mac_address in discovered_cameras
        and camera.camera.rtsp_port
        != discovered_cameras[camera.camera.mac_address].rtsp_port
    ]
