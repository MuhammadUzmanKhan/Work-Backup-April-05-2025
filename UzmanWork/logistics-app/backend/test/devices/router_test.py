import pytest
from fastapi import status
from httpx import AsyncClient
from pydantic import ValidationError

from backend.constants import UNASSIGNED_TENANT
from backend.database import database, orm
from backend.database.models import (
    NVR,
    Camera,
    CameraFlag,
    CameraGroup,
    Location,
    UpdateCameraFlag,
    UpdateCameraRtspUrlRequest,
    UpdateCamerasWebrtcFlag,
    UpdateCameraVideoOrientationType,
    UpdateNvrLocationRequest,
    VideoOrientationType,
)
from backend.database.organization_models import Organization
from backend.devices.devices_models import (
    DeleteCameraRequest,
    UpdateLocationAddressRequest,
    UpdateLocationEnableSettingTimezoneRequest,
    UpdateLocationNameRequest,
    UpdateLocationTimezoneRequest,
)
from backend.models import AccessRestrictions
from backend.router_utils import get_camera_from_mac_address_or_fail
from backend.test.client_request import send_delete_request, send_post_request
from backend.test.factory_types import (
    CameraFactory,
    LocationFactory,
    NVRFactory,
    OrganizationFactory,
    RandomStringFactory,
)


async def test_update_camera_video_orientation_type(
    devices_client: AsyncClient, camera: Camera
) -> None:
    await send_post_request(
        devices_client,
        "/update_camera_video_orientation_type",
        UpdateCameraVideoOrientationType(
            mac_address=camera.mac_address,
            video_orientation_type=VideoOrientationType.Orientation90R,
        ).dict(),
    )

    await send_post_request(
        devices_client,
        "/update_camera_video_orientation_type",
        UpdateCameraVideoOrientationType(
            mac_address=camera.mac_address,
            video_orientation_type=VideoOrientationType.OrientationIdentity,
        ).dict(),
    )


async def test_update_camera_flag(devices_client: AsyncClient, camera: Camera) -> None:
    for flag_enum in CameraFlag:
        await send_post_request(
            devices_client,
            "/update_camera_flag",
            UpdateCameraFlag(
                mac_address=camera.mac_address, flag_enum=flag_enum, flag_value=True
            ),
        )

        await send_post_request(
            devices_client,
            "/update_camera_flag",
            UpdateCameraFlag(
                mac_address=camera.mac_address, flag_enum=flag_enum, flag_value=False
            ),
        )


async def test_update_webrtc_bulk_flag(
    devices_client: AsyncClient,
    nvr: NVR,
    camera_group: CameraGroup,
    create_camera: CameraFactory,
) -> None:
    cameras = [
        await create_camera(camera_group_id=camera_group.id, nvr_uuid=nvr.uuid)
        for _ in range(10)
    ]
    await send_post_request(
        devices_client,
        "/update_webrtc_bulk_flag",
        UpdateCamerasWebrtcFlag(
            mac_addresses=[camera.mac_address for camera in cameras], flag_value=True
        ),
    )

    await send_post_request(
        devices_client,
        "/update_webrtc_bulk_flag",
        UpdateCamerasWebrtcFlag(
            mac_addresses=[camera.mac_address for camera in cameras], flag_value=False
        ),
    )


async def test_update_location_name(
    devices_client: AsyncClient, location: Location, create_name: RandomStringFactory
) -> None:
    new_name = create_name()
    resp = await send_post_request(
        devices_client,
        "/update_location_name",
        UpdateLocationNameRequest(location_id=location.id, name=new_name),
    )

    assert resp.json() == new_name


async def test_update_location_name_too_short(
    devices_client: AsyncClient, location: Location
) -> None:
    new_name = ""
    with pytest.raises(ValidationError):
        await send_post_request(
            devices_client,
            "/update_location_name",
            UpdateLocationNameRequest(location_id=location.id, name=new_name),
        )


async def test_update_location_address(
    devices_client: AsyncClient, location: Location, create_name: RandomStringFactory
) -> None:
    new_address = create_name()
    resp = await send_post_request(
        devices_client,
        "/update_location_address",
        UpdateLocationAddressRequest(location_id=location.id, address=new_address),
    )

    assert resp.json() == new_address


async def test_update_location_address_too_short(
    devices_client: AsyncClient, location: Location
) -> None:
    new_address = "aaaa"
    with pytest.raises(ValidationError):
        await send_post_request(
            devices_client,
            "/update_location_address",
            UpdateLocationAddressRequest(location_id=location.id, address=new_address),
        )


async def test_update_location_timezone(
    devices_client: AsyncClient, location: Location
) -> None:
    new_timezone = "Europe/London"

    await send_post_request(
        devices_client,
        "/update_location_timezone",
        UpdateLocationTimezoneRequest(location_id=location.id, timezone=new_timezone),
        expected_status_code=status.HTTP_400_BAD_REQUEST,
    )

    success_manual_override_response = await send_post_request(
        devices_client,
        "/update_location_enable_setting_timezone",
        UpdateLocationEnableSettingTimezoneRequest(
            location_id=location.id, enable_setting_timezone=True
        ),
    )
    assert success_manual_override_response.status_code == 200

    success_timezone_update_response = await send_post_request(
        devices_client,
        "/update_location_timezone",
        UpdateLocationTimezoneRequest(location_id=location.id, timezone=new_timezone),
    )
    assert success_timezone_update_response.status_code == 200
    assert success_timezone_update_response.json() == new_timezone


async def test_enable_camera_over_nvr_capacity_and_expect_409_conflict(
    devices_client: AsyncClient,
    nvr: NVR,
    create_camera: CameraFactory,
    camera_group: CameraGroup,
) -> None:
    for _ in range(nvr.max_cameras_slots):
        await create_camera(camera_group.id, nvr.uuid)

    # This camera is overcapacity, and we must not be able to enable additional camera
    disabled_camera = await create_camera(camera_group.id, nvr.uuid, is_enabled=False)

    # NOTE(@lberg): this route does not take a model, so we need this hack
    try_enable_camera_resp = await devices_client.post(
        "/enable_camera", params=[("camera_id", disabled_camera.id)]
    )
    assert try_enable_camera_resp.status_code == status.HTTP_409_CONFLICT


async def test_delete_camera(
    devices_client: AsyncClient,
    nvr: NVR,
    db_instance: database.Database,
    create_camera: CameraFactory,
    camera_group: CameraGroup,
) -> None:
    camera = await create_camera(camera_group.id, nvr.uuid)

    await send_post_request(
        devices_client,
        "/delete_camera",
        DeleteCameraRequest(mac_address=camera.mac_address),
    )

    async with db_instance.session() as session:
        deleted_cameras = await orm.Camera.system_get_cameras_from_mac_addresses(
            session, {camera.mac_address}
        )
    assert len(deleted_cameras) == 1
    assert deleted_cameras[0].camera.mac_address == camera.mac_address
    assert deleted_cameras[0].camera.tenant == UNASSIGNED_TENANT


async def test_delete_non_existing_camera(
    devices_client: AsyncClient,
    nvr: NVR,
    db_instance: database.Database,
    create_camera: CameraFactory,
    camera_group: CameraGroup,
    organization: Organization,
) -> None:
    camera = await create_camera(camera_group.id, nvr.uuid)

    non_existing_mac_address = "00:00:00:00:00:00"
    await send_post_request(
        devices_client,
        "/delete_camera",
        DeleteCameraRequest(mac_address=non_existing_mac_address),
        expected_status_code=status.HTTP_400_BAD_REQUEST,
    )

    async with db_instance.session() as session:
        remaining_cameras = await orm.Camera.system_get_cameras_from_mac_addresses(
            session, {camera.mac_address}
        )

    assert len(remaining_cameras) == 1
    assert remaining_cameras[0].camera.mac_address == camera.mac_address
    assert remaining_cameras[0].camera.tenant == organization.tenant


async def test_update_camera_rtsp_url(
    db_instance: database.Database, devices_client: AsyncClient, camera: Camera
) -> None:
    mac_address = camera.mac_address
    values = ["url1", None, "url2", None]
    for value in values:
        await send_post_request(
            devices_client,
            "/update_camera_rtsp_url",
            UpdateCameraRtspUrlRequest(mac_address=mac_address, rtsp_url=value).dict(),
        )

        async with db_instance.tenant_session(tenant=camera.tenant) as session:
            camera_ret = await get_camera_from_mac_address_or_fail(
                session, AccessRestrictions(), mac_address
            )
            assert camera_ret.enforced_rtsp_url == value


async def test_update_nvr_location(
    devices_client: AsyncClient, nvr: NVR, create_location: LocationFactory
) -> None:
    location = await create_location(nvr.tenant)
    await send_post_request(
        devices_client,
        "/update_nvr_location",
        UpdateNvrLocationRequest(nvr_uuid=nvr.uuid, location_id=location.id),
    )


async def test_update_nvr_location_no_access(
    devices_client: AsyncClient,
    nvr: NVR,
    create_location: LocationFactory,
    create_organization: OrganizationFactory,
) -> None:
    new_organization = await create_organization()
    location = await create_location(new_organization.tenant)
    await send_post_request(
        devices_client,
        "/update_nvr_location",
        UpdateNvrLocationRequest(nvr_uuid=nvr.uuid, location_id=location.id),
        expected_status_code=status.HTTP_400_BAD_REQUEST,
    )


async def test_delete_location_with_nvr(
    devices_client: AsyncClient,
    db_instance: database.Database,
    location: Location,
    create_nvr: NVRFactory,
    organization: Organization,
) -> None:
    await create_nvr(location_id=location.id, tenant=organization.tenant)
    await send_delete_request(
        devices_client,
        f"/delete_location/{location.id}",
        expected_status_code=status.HTTP_409_CONFLICT,
    )
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        location_ret = await orm.Location.get_locations_info(
            session, AccessRestrictions()
        )
        assert location_ret != []


async def test_delete_location(
    devices_client: AsyncClient,
    db_instance: database.Database,
    create_location: LocationFactory,
    organization: Organization,
) -> None:
    location = await create_location(tenant=organization.tenant)
    await send_delete_request(devices_client, f"/delete_location/{location.id}")
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        location_ret = await orm.Location.get_locations_info(
            session, AccessRestrictions()
        )
        location_ids = [loc.id for loc in location_ret]
        assert location.id not in location_ids
