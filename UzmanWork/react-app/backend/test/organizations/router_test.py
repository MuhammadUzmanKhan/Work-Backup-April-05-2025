import datetime
from typing import Sequence

from fastapi import FastAPI
from httpx import AsyncClient

from backend import auth, auth_models
from backend.database import database, orm
from backend.database.models import NVR, CameraGroup, DayOfWeek
from backend.database.network_scan_models import (
    NetworkScanAuto,
    NetworkScanManual,
    NetworkScanScheduled,
    NetworkScanSettings,
)
from backend.database.organization_models import Organization, OrgCamerasAudioSettings
from backend.organizations.organizations_models import (
    NetworkScanSettingsResponse,
    NetworkScanSettingsUpdateRequest,
    OrgCamerasAudioSettingsUpdateRequest,
    OrgNumberLicensesCamerasUpdateRequest,
)
from backend.test.client_request import send_get_request, send_post_request
from backend.test.conftest import mock_app_user_guard
from backend.test.factory_types import CameraFactory


async def test_update_audio_settings_toggle(
    organizations_router_client: AsyncClient,
    organization: Organization,
    camera_group: CameraGroup,
    nvr: NVR,
    create_camera: CameraFactory,
    db_instance: database.Database,
) -> None:
    # generate cameras with audio disabled
    cameras = [
        await create_camera(
            camera_group_id=camera_group.id, nvr_uuid=nvr.uuid, is_audio_enabled=False
        )
        for _ in range(10)
    ]

    steps = [
        {"command": OrgCamerasAudioSettings.ENABLED, "expected_audio_enabled": True},
        {"command": OrgCamerasAudioSettings.DISABLED, "expected_audio_enabled": False},
        {"command": OrgCamerasAudioSettings.ENABLED, "expected_audio_enabled": True},
        {"command": OrgCamerasAudioSettings.MANUAL, "expected_audio_enabled": True},
    ]
    for step in steps:
        await send_post_request(
            organizations_router_client,
            "/update_audio_settings",
            OrgCamerasAudioSettingsUpdateRequest(audio_settings=step["command"]).dict(),
        )

        async with db_instance.tenant_session(tenant=organization.tenant) as session:
            retrieved_cameras = await orm.Camera.get_cameras_from_mac_addresses(
                session, set([camera.mac_address for camera in cameras])
            )
            assert all(
                camera.camera.is_audio_enabled == step["expected_audio_enabled"]
                for camera in retrieved_cameras
            )


async def test_number_licensed_cameras_non_coram_user(
    organizations_router_client: AsyncClient,
) -> None:
    await send_post_request(
        organizations_router_client,
        "/update_number_licensed_cameras",
        OrgNumberLicensesCamerasUpdateRequest(number_licensed_cameras=None).dict(),
        expected_status_code=403,
    )


async def test_number_licensed_cameras(
    app_user: auth_models.AppUser,
    organizations_app: FastAPI,
    organizations_router_client: AsyncClient,
    organization: Organization,
    db_instance: database.Database,
) -> None:
    admin_user = app_user.copy()
    admin_user.user_email = "test@coram.ai"
    admin_user.role = auth.UserRole.ADMIN
    organizations_app.dependency_overrides[auth.admin_user_role_guard] = (
        await mock_app_user_guard(admin_user)
    )

    steps: Sequence[dict[str, int | None]] = [
        {"number_licensed_cameras": 10},
        {"number_licensed_cameras": 5},
        {"number_licensed_cameras": None},
        {"number_licensed_cameras": 10},
    ]

    for step in steps:
        await send_post_request(
            organizations_router_client,
            "/update_number_licensed_cameras",
            OrgNumberLicensesCamerasUpdateRequest(
                number_licensed_cameras=step["number_licensed_cameras"]
            ).dict(),
        )
        async with db_instance.tenant_session(tenant=organization.tenant) as session:
            num_license_cameras = (
                await orm.Organization.get_org_number_licensed_cameras(session)
            )
            assert num_license_cameras == step["number_licensed_cameras"]


async def test_network_scan_settings(organizations_router_client: AsyncClient) -> None:
    requests: Sequence[NetworkScanSettings] = [
        NetworkScanAuto(),
        NetworkScanManual(),
        NetworkScanScheduled(
            days=[DayOfWeek.SATURDAY],
            start_time=datetime.time.fromisoformat("00:00:00"),
            end_time=datetime.time.fromisoformat("12:20:10"),
        ),
    ]

    for req in requests:
        await send_post_request(
            organizations_router_client,
            "/update_network_scan_settings",
            NetworkScanSettingsUpdateRequest(network_scan_settings=req).dict(),
        )
        res_raw = await send_get_request(
            organizations_router_client, "/retrieve_network_scan_settings"
        )
        res = NetworkScanSettingsResponse.parse_obj(res_raw.json())
        assert res.network_scan_settings == req
