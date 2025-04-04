from ipaddress import IPv4Address

from fastapi import FastAPI, status
from httpx import AsyncClient

from backend import auth, auth_models
from backend.database import database, orm
from backend.database.models import NVR, CameraGroup
from backend.database.organization_models import Organization
from backend.stream_discovery.models import (
    DiscoveredCamera,
    DiscoveryCachedEntry,
    DiscoveryRequest,
    NvrCapabilities,
    NvrStatusResponse,
)
from backend.test.client_request import send_get_request, send_post_request
from backend.test.conftest import mock_edge_user_guard
from backend.test.factory_types import CameraDefaultFactory, CameraFactory, NVRFactory
from backend.value_store.value_store import ValueStore, get_nvr_discovery_key


def generate_discovered_cameras(mac_addresses: list[str]) -> list[DiscoveredCamera]:
    return [
        DiscoveredCamera(
            mac_address=mac_address,
            ip=IPv4Address(f"127.0.0.{idx_camera}"),
            vendor="CoramAI",
            streaming_codec="h264",
        )
        for idx_camera, mac_address in enumerate(mac_addresses)
    ]


async def test_discovery_no_nvr(
    app: FastAPI, discovery_client: AsyncClient, organization: Organization
) -> None:
    app.dependency_overrides[auth.edge_user_role_guard] = await mock_edge_user_guard(
        auth_models.EdgeUser(user_uuid="uuid", tenant=organization.tenant)
    )
    response = await send_post_request(
        discovery_client,
        "upload",
        DiscoveryRequest(
            nvr_uuid="uuid",
            cameras=generate_discovered_cameras(["00:00:00:00:00:00"]),
            nvr_capabilities=NvrCapabilities(),
        ),
        expected_status_code=status.HTTP_400_BAD_REQUEST,
    )
    response_json = response.json()
    # We expect an error message that the NVR is not found
    assert "detail" in response_json and "not found" in response_json["detail"]


async def test_discovery_nvr_unregistered(
    app: FastAPI,
    discovery_client: AsyncClient,
    create_nvr: NVRFactory,
    organization: Organization,
) -> None:
    nvr = await create_nvr(None)
    app.dependency_overrides[auth.edge_user_role_guard] = await mock_edge_user_guard(
        auth_models.EdgeUser(user_uuid=nvr.uuid, tenant=organization.tenant)
    )

    discovered_mac_addresses = ["00:00:00:00:00:00", "00:00:00:00:00:01"]
    discovered_cameras = generate_discovered_cameras(discovered_mac_addresses)
    response = await send_post_request(
        discovery_client,
        "upload",
        DiscoveryRequest(
            nvr_uuid=nvr.uuid,
            cameras=discovered_cameras,
            nvr_capabilities=NvrCapabilities(),
        ),
        expected_status_code=status.HTTP_400_BAD_REQUEST,
    )

    response_json = response.json()
    # We expect an error message that the NVR is not registered
    assert "detail" in response_json and "not registered" in response_json["detail"]


async def test_discovery_in_redis(
    discovery_client: AsyncClient, value_store: ValueStore, nvr: NVR
) -> None:
    discovered_mac_addresses = [
        "00:00:00:00:00:00",
        "00:00:00:00:00:01",
        "00:00:00:00:00:02",
    ]
    discovered_cameras = generate_discovered_cameras(discovered_mac_addresses)
    await send_post_request(
        discovery_client,
        "upload",
        DiscoveryRequest(
            nvr_uuid=nvr.uuid,
            cameras=discovered_cameras,
            nvr_capabilities=NvrCapabilities(),
        ),
    )

    cache = await value_store.get_model(
        get_nvr_discovery_key(nvr.uuid), DiscoveryCachedEntry
    )
    assert cache is not None
    for camera in discovered_cameras:
        assert camera.mac_address in cache.cached_cameras
        assert cache.cached_cameras[camera.mac_address].camera == camera


# TODO(@lberg): most of the tests above can be removed after V2


async def test_nvr_status_no_nvr(
    app: FastAPI, discovery_client: AsyncClient, organization: Organization
) -> None:
    nvr_uuid = "uuid"
    app.dependency_overrides[auth.edge_user_role_guard] = await mock_edge_user_guard(
        auth_models.EdgeUser(user_uuid=nvr_uuid, tenant=organization.tenant)
    )
    response = await send_get_request(
        discovery_client,
        f"status/{nvr_uuid}",
        expected_status_code=status.HTTP_400_BAD_REQUEST,
    )

    response_json = response.json()
    # We expect an error message that the NVR is not found
    assert "detail" in response_json and "not found" in response_json["detail"]


async def test_nvr_status_unregistered(
    app: FastAPI,
    discovery_client: AsyncClient,
    create_nvr: NVRFactory,
    organization: Organization,
) -> None:
    nvr = await create_nvr(None)
    app.dependency_overrides[auth.edge_user_role_guard] = await mock_edge_user_guard(
        auth_models.EdgeUser(user_uuid=nvr.uuid, tenant=organization.tenant)
    )

    response = await send_get_request(
        discovery_client,
        f"status/{nvr.uuid}",
        expected_status_code=status.HTTP_400_BAD_REQUEST,
    )
    response_json = response.json()
    # We expect an error message that the NVR is not registered
    assert "detail" in response_json and "not registered" in response_json["detail"]


async def test_nvr_status_no_cameras(discovery_client: AsyncClient, nvr: NVR) -> None:
    response = await send_get_request(
        discovery_client, f"status/{nvr.uuid}", expected_status_code=200
    )

    nvr_status = NvrStatusResponse.parse_raw(response.content)
    # We expect no cameras
    assert nvr_status.cameras_enabled == []
    assert nvr_status.mac_addresses_disabled == []


async def test_nvr_status_with_cameras(
    discovery_client: AsyncClient, nvr: NVR, create_camera_default: CameraDefaultFactory
) -> None:
    cameras = [(await create_camera_default()) for _ in range(2)]
    response = await send_get_request(
        discovery_client, f"status/{nvr.uuid}", expected_status_code=200
    )
    nvr_status = NvrStatusResponse.parse_raw(response.content)
    # We expect cameras to be enabled
    assert set([camera.mac_address for camera in nvr_status.cameras_enabled]) == set(
        [camera.mac_address for camera in cameras]
    )


async def test_nvr_status_custom_rtsp_ports(
    discovery_client: AsyncClient, nvr: NVR, create_camera_default: CameraDefaultFactory
) -> None:
    cameras = [(await create_camera_default(rtsp_port=7070 + idx)) for idx in range(2)]
    response = await send_get_request(
        discovery_client, f"status/{nvr.uuid}", expected_status_code=200
    )
    nvr_status = NvrStatusResponse.parse_raw(response.content)
    # check custom rtsp ports
    assert set([camera.rtsp_port for camera in nvr_status.cameras_enabled]) == set(
        [camera.rtsp_port for camera in cameras]
    )


async def test_nvr_status_with_custom_credentials(
    discovery_client: AsyncClient,
    nvr: NVR,
    camera_group: CameraGroup,
    create_camera: CameraFactory,
) -> None:
    username, password = "TheAdmin", "ThePassword"
    await create_camera(
        camera_group_id=camera_group.id,
        nvr_uuid=nvr.uuid,
        username=username,
        password=password,
    )

    response = await send_get_request(
        discovery_client, f"status/{nvr.uuid}", expected_status_code=200
    )

    nvr_status = NvrStatusResponse.parse_raw(response.content)
    assert nvr_status.mac_addresses_disabled == []

    # We expected the credentials to be returned
    assert len(nvr_status.cameras_enabled) == 1
    assert nvr_status.cameras_enabled[0].username == username
    assert nvr_status.cameras_enabled[0].password == password


async def test_nvr_status_disabled(
    db_instance: database.Database,
    discovery_client: AsyncClient,
    nvr: NVR,
    create_camera_default: CameraDefaultFactory,
    organization: Organization,
) -> None:
    camera = await create_camera_default()
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.Camera.disable_camera(session, camera.id)
    response = await send_get_request(
        discovery_client, f"status/{nvr.uuid}", expected_status_code=200
    )

    nvr_status = NvrStatusResponse.parse_raw(response.content)
    # We expect all cameras to be rejected
    assert nvr_status.cameras_enabled == []
    assert set(nvr_status.mac_addresses_disabled) == {camera.mac_address}


async def test_nvr_status_multi_head_credentials(
    discovery_client: AsyncClient,
    nvr: NVR,
    camera_group: CameraGroup,
    create_camera: CameraFactory,
) -> None:
    username, password = "admin", "password"

    main_head_mac = (
        await create_camera(
            camera_group_id=camera_group.id,
            nvr_uuid=nvr.uuid,
            username=username,
            password=password,
        )
    ).mac_address

    # NOTE(@lberg): we are not setting the username and password here
    # they should inherit the credentials from the main head
    secondary_macs = [
        (
            await create_camera(
                camera_group_id=camera_group.id,
                nvr_uuid=nvr.uuid,
                mac_address=f"{main_head_mac}-{idx}",
            )
        ).mac_address
        for idx in range(1, 10)
    ]

    mac_addresses = [main_head_mac] + [mac for mac in secondary_macs]

    response = await send_get_request(
        discovery_client, f"status/{nvr.uuid}", expected_status_code=200
    )

    nvr_status = NvrStatusResponse.parse_raw(response.content)
    assert len(nvr_status.cameras_enabled) == len(mac_addresses)
    for accepted in nvr_status.cameras_enabled:
        assert accepted.username == username
        assert accepted.password == password
