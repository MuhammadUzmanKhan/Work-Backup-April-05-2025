from fastapi import FastAPI, status
from httpx import AsyncClient

from backend import auth, auth_models
from backend.cameras_registration.cameras_registration_models import (
    CandidateCamerasResponse,
    RegisterCandidateCamerasRequest,
    RegisterCandidateCamerasResponse,
)
from backend.database import database, orm
from backend.database.models import NVR, CameraGroup, Location
from backend.database.organization_models import Organization
from backend.test.cameras_registration.factory_types import (
    CachedDiscoveryFactory,
    CandidateCameraDataFactory,
)
from backend.test.client_request import send_get_request, send_post_request
from backend.test.conftest import mock_app_user_guard
from backend.test.factory_types import (
    CameraFactory,
    LocationFactory,
    NVRFactory,
    OrganizationFactory,
    RandomStringFactory,
)


async def test_list_candidate_cameras_no_discovery(
    cameras_registration_client: AsyncClient, nvr: NVR, location: Location
) -> None:
    response = await send_get_request(
        cameras_registration_client, f"/candidate_cameras/{location.id}"
    )
    candidates = CandidateCamerasResponse.parse_raw(response.content)
    assert set([nvr.uuid]) == candidates.unavailable_nvr_uuids


async def test_list_candidate_cameras_no_cameras_in_db(
    cameras_registration_client: AsyncClient,
    location: Location,
    add_discovery_to_value_store: CachedDiscoveryFactory,
) -> None:
    cameras_mac_address = ["FF:FF:00:00:00:00", "FF:FA:00:00:00:01"]
    await add_discovery_to_value_store(None, cameras_mac_address)
    response = await send_get_request(
        cameras_registration_client, f"/candidate_cameras/{location.id}"
    )
    # we should get the cameras, as they are only in the local cache
    candidates = CandidateCamerasResponse.parse_raw(response.content)
    assert len(candidates.candidate_cameras_data) == len(cameras_mac_address)


async def test_list_candidate_cameras_all_cameras_in_db(
    cameras_registration_client: AsyncClient,
    nvr: NVR,
    camera_group: CameraGroup,
    location: Location,
    create_camera: CameraFactory,
    add_discovery_to_value_store: CachedDiscoveryFactory,
) -> None:
    # add cameras to the DB
    cameras = [await create_camera(camera_group.id, nvr.uuid) for _ in range(10)]
    # add all of them to discovery too
    await add_discovery_to_value_store(
        nvr.uuid, [camera.mac_address for camera in cameras]
    )

    response = await send_get_request(
        cameras_registration_client, f"/candidate_cameras/{location.id}"
    )

    # we should get no candidates, as all cameras are in the DB
    candidates = CandidateCamerasResponse.parse_raw(response.content)
    assert len(candidates.candidate_cameras_data) == 0


async def test_list_candidate_cameras_some_cameras_in_db(
    cameras_registration_client: AsyncClient,
    nvr: NVR,
    camera_group: CameraGroup,
    location: Location,
    create_camera: CameraFactory,
    add_discovery_to_value_store: CachedDiscoveryFactory,
    create_mac_address: RandomStringFactory,
) -> None:
    # add cameras to the DB
    cameras = [await create_camera(camera_group.id, nvr.uuid) for _ in range(10)]
    # generate some new addresses
    new_cameras_mac_address = [create_mac_address() for _ in range(10)]
    # add all of them to discovery too
    await add_discovery_to_value_store(
        nvr.uuid, [camera.mac_address for camera in cameras] + new_cameras_mac_address
    )

    response = await send_get_request(
        cameras_registration_client, f"/candidate_cameras/{location.id}"
    )

    # we should get no candidates, as all cameras are in the DB
    candidates = CandidateCamerasResponse.parse_raw(response.content)
    assert len(candidates.candidate_cameras_data) == len(new_cameras_mac_address)


async def test_list_candidate_cameras_no_cameras_in_db_multiple_nvrs(
    cameras_registration_client: AsyncClient,
    nvr: NVR,
    create_nvr: NVRFactory,
    location: Location,
    add_discovery_to_value_store: CachedDiscoveryFactory,
    create_mac_address: RandomStringFactory,
) -> None:
    another_nvr = await create_nvr(location.id)
    nvrs = [nvr, another_nvr]
    cameras_mac_address = [create_mac_address() for _ in range(10)]
    for nvr in nvrs:
        await add_discovery_to_value_store(nvr.uuid, cameras_mac_address)

    response = await send_get_request(
        cameras_registration_client, f"/candidate_cameras/{location.id}"
    )

    candidates = CandidateCamerasResponse.parse_raw(response.content)
    for camera in candidates.candidate_cameras_data:
        assert camera.mac_address in cameras_mac_address
        assert camera.nvr_uuids == set([nvr.uuid for nvr in nvrs])


async def test_list_candidate_cameras_one_nvr_fail(
    cameras_registration_client: AsyncClient,
    nvr: NVR,
    create_nvr: NVRFactory,
    location: Location,
    add_discovery_to_value_store: CachedDiscoveryFactory,
    create_mac_address: RandomStringFactory,
) -> None:
    another_nvr = await create_nvr(location.id)
    cameras_mac_address = [create_mac_address() for _ in range(10)]
    await add_discovery_to_value_store(nvr.uuid, cameras_mac_address)

    response = await send_get_request(
        cameras_registration_client, f"/candidate_cameras/{location.id}"
    )

    candidates = CandidateCamerasResponse.parse_raw(response.content)
    assert set([another_nvr.uuid]) == candidates.unavailable_nvr_uuids
    for camera in candidates.candidate_cameras_data:
        assert camera.mac_address in cameras_mac_address
        assert camera.nvr_uuids == set([nvr.uuid])
    assert len(candidates.candidate_nvrs_data) == 1


async def test_list_candidate_cameras_no_discovery_no_nvr_data(
    cameras_registration_client: AsyncClient, nvr: NVR, location: Location
) -> None:
    response = await send_get_request(
        cameras_registration_client, f"/candidate_cameras/{location.id}"
    )

    candidates = CandidateCamerasResponse.parse_raw(response.content)
    assert len(candidates.candidate_nvrs_data) == 0


async def test_list_candidate_cameras_multiple_nvrs_num_slots(
    cameras_registration_client: AsyncClient,
    nvr: NVR,
    create_nvr: NVRFactory,
    location: Location,
    camera_group: CameraGroup,
    create_camera: CameraFactory,
    add_discovery_to_value_store: CachedDiscoveryFactory,
) -> None:
    another_nvr = await create_nvr(location.id)
    nvrs = [nvr, another_nvr]
    num_cameras_to_create = 10
    num_available_slots = nvr.max_cameras_slots - num_cameras_to_create
    for nvr in nvrs:
        cameras = [
            await create_camera(camera_group.id, nvr.uuid)
            for _ in range(num_cameras_to_create)
        ]
        # we need to store a discovery or the nvr data will be missing
        await add_discovery_to_value_store(
            nvr.uuid, [camera.mac_address for camera in cameras]
        )

    response = await send_get_request(
        cameras_registration_client, f"/candidate_cameras/{location.id}"
    )

    candidates = CandidateCamerasResponse.parse_raw(response.content)
    assert len(candidates.candidate_nvrs_data) == 2
    for candidate_nvr in candidates.candidate_nvrs_data:
        assert candidate_nvr.num_available_slots == num_available_slots


async def test_register_candidates_with_no_nvr_capacity(
    cameras_registration_client: AsyncClient,
    nvr: NVR,
    location: Location,
    camera_group: CameraGroup,
    create_camera: CameraFactory,
    create_candidate_camera_data: CandidateCameraDataFactory,
) -> None:
    for _ in range(nvr.max_cameras_slots):
        await create_camera(camera_group.id, nvr.uuid)

    await send_post_request(
        cameras_registration_client,
        f"/register_candidates/{location.id}",
        RegisterCandidateCamerasRequest(
            candidate_cameras_data=[create_candidate_camera_data({nvr.uuid})]
        ),
        expected_status_code=status.HTTP_400_BAD_REQUEST,
    )


async def test_register_candidates_within_nvr_capacity_as_1_camera_is_disabled(
    cameras_registration_client: AsyncClient,
    nvr: NVR,
    location: Location,
    camera_group: CameraGroup,
    create_camera: CameraFactory,
    create_candidate_camera_data: CandidateCameraDataFactory,
) -> None:
    for _ in range(nvr.max_cameras_slots - 1):
        await create_camera(camera_group.id, nvr.uuid)
    await create_camera(camera_group.id, nvr.uuid, is_enabled=False)

    await send_post_request(
        cameras_registration_client,
        f"/register_candidates/{location.id}",
        RegisterCandidateCamerasRequest(
            candidate_cameras_data=[create_candidate_camera_data({nvr.uuid})]
        ),
    )


async def test_register_candidates_partially_over_nvr_capacity(
    cameras_registration_client: AsyncClient,
    nvr: NVR,
    location: Location,
    camera_group: CameraGroup,
    create_camera: CameraFactory,
    create_candidate_camera_data: CandidateCameraDataFactory,
) -> None:
    for _ in range(nvr.max_cameras_slots - 1):
        await create_camera(camera_group.id, nvr.uuid)

    resp = await send_post_request(
        cameras_registration_client,
        f"/register_candidates/{location.id}",
        RegisterCandidateCamerasRequest(
            candidate_cameras_data=[
                create_candidate_camera_data({nvr.uuid}),
                create_candidate_camera_data({nvr.uuid}),
            ]
        ),
    )
    assignments = RegisterCandidateCamerasResponse.parse_obj(resp.json())
    assert len(assignments.failed_assignments) == 1
    assert len(assignments.successful_assignments) == 1


async def test_register_candidates_over_nvr_capacity(
    cameras_registration_client: AsyncClient,
    nvr: NVR,
    location: Location,
    camera_group: CameraGroup,
    create_camera: CameraFactory,
    create_candidate_camera_data: CandidateCameraDataFactory,
) -> None:
    for _ in range(nvr.max_cameras_slots):
        await create_camera(camera_group.id, nvr.uuid)

    await send_post_request(
        cameras_registration_client,
        f"/register_candidates/{location.id}",
        RegisterCandidateCamerasRequest(
            candidate_cameras_data=[
                create_candidate_camera_data({nvr.uuid}),
                create_candidate_camera_data({nvr.uuid}),
            ]
        ),
        expected_status_code=status.HTTP_400_BAD_REQUEST,
    )


async def test_register_candidate_that_before_was_assigned_to_another_tenant(
    app: FastAPI,
    app_user: auth_models.AppUser,
    cameras_registration_client: AsyncClient,
    nvr: NVR,
    location: Location,
    camera_group: CameraGroup,
    create_camera: CameraFactory,
    create_candidate_camera_data: CandidateCameraDataFactory,
    organization: Organization,
    create_organization: OrganizationFactory,
    create_location: LocationFactory,
    create_nvr: NVRFactory,
    db_instance: database.Database,
) -> None:
    camera_candidate = create_candidate_camera_data({nvr.uuid})
    # First tenant registers the camera
    await send_post_request(
        cameras_registration_client,
        f"/register_candidates/{location.id}",
        RegisterCandidateCamerasRequest(candidate_cameras_data=[camera_candidate]),
    )

    # Unassign the camera from the first tenant
    async with db_instance.session() as session:
        await orm.Camera.system_unassign_camera(session, camera_candidate.mac_address)

    # Second tenant registers the camera
    second_organisation = await create_organization()

    second_tenant_admin_user = app_user.copy()
    second_tenant_admin_user.tenant = second_organisation.tenant
    app.dependency_overrides[auth.admin_user_role_guard] = await mock_app_user_guard(
        second_tenant_admin_user
    )

    second_organisation_location = await create_location(second_organisation.tenant)
    second_organisation_nvr = await create_nvr(
        location_id=second_organisation_location.id, tenant=second_organisation.tenant
    )

    camera_candidate.nvr_uuids = {second_organisation_nvr.uuid}
    await send_post_request(
        cameras_registration_client,
        f"/register_candidates/{second_organisation_location.id}",
        RegisterCandidateCamerasRequest(candidate_cameras_data=[camera_candidate]),
    )


async def test_register_candidate_that_belongs_to_another_tenant(
    app: FastAPI,
    app_user: auth_models.AppUser,
    cameras_registration_client: AsyncClient,
    nvr: NVR,
    location: Location,
    camera_group: CameraGroup,
    create_camera: CameraFactory,
    create_candidate_camera_data: CandidateCameraDataFactory,
    organization: Organization,
    create_organization: OrganizationFactory,
    create_location: LocationFactory,
    create_nvr: NVRFactory,
    db_instance: database.Database,
) -> None:
    camera_candidate = create_candidate_camera_data({nvr.uuid})
    # First tenant registers the camera
    await send_post_request(
        cameras_registration_client,
        f"/register_candidates/{location.id}",
        RegisterCandidateCamerasRequest(candidate_cameras_data=[camera_candidate]),
    )

    # Second tenant registers the camera
    second_organisation = await create_organization()

    second_tenant_admin_user = app_user.copy()
    second_tenant_admin_user.tenant = second_organisation.tenant
    app.dependency_overrides[auth.admin_user_role_guard] = await mock_app_user_guard(
        second_tenant_admin_user
    )

    second_organisation_location = await create_location(second_organisation.tenant)
    second_organisation_nvr = await create_nvr(
        location_id=second_organisation_location.id, tenant=second_organisation.tenant
    )

    camera_candidate.nvr_uuids = {second_organisation_nvr.uuid}
    await send_post_request(
        cameras_registration_client,
        f"/register_candidates/{second_organisation_location.id}",
        RegisterCandidateCamerasRequest(candidate_cameras_data=[camera_candidate]),
    )
