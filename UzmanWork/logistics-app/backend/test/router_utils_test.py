import fastapi
import pytest

from backend.database import database
from backend.database.models import NVR, Camera, CameraGroup, Location
from backend.database.organization_models import Organization
from backend.models import AccessRestrictions
from backend.router_utils import (
    check_camera_access,
    get_camera_from_mac_address_or_fail,
    get_camera_response_from_mac_address_or_fail,
    get_cameras_from_mac_address_or_fail,
    get_nvr_from_uuid_or_fail,
    get_nvr_response_from_uuid_or_fail,
    get_nvr_responses_from_uuid_or_fail,
)
from backend.test.factory_types import CameraFactory, LocationFactory, NVRFactory


async def test_get_cameras_or_fail(
    db_instance: database.Database,
    organization: Organization,
    nvr: NVR,
    camera_group: CameraGroup,
    create_camera: CameraFactory,
) -> None:
    cameras = [
        await create_camera(camera_group_id=camera_group.id, nvr_uuid=nvr.uuid)
        for _ in range(3)
    ]

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        cameras_ret = await get_cameras_from_mac_address_or_fail(
            session, AccessRestrictions(), [camera.mac_address for camera in cameras]
        )
    assert len(cameras_ret) == len(cameras)
    assert set([camera.mac_address for camera in cameras]) == set(
        [camera.mac_address for camera in cameras_ret]
    )


async def test_get_cameras_or_fail_no_access(
    db_instance: database.Database,
    organization: Organization,
    nvr: NVR,
    camera_group: CameraGroup,
    create_camera: CameraFactory,
) -> None:
    cameras = [
        await create_camera(camera_group_id=camera_group.id, nvr_uuid=nvr.uuid)
        for _ in range(3)
    ]

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        with pytest.raises(fastapi.HTTPException):
            await get_cameras_from_mac_address_or_fail(
                session,
                AccessRestrictions(full_access=False, camera_groups=[]),
                [camera.mac_address for camera in cameras],
            )


async def test_check_camera_access(
    db_instance: database.Database, organization: Organization, camera: Camera
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await check_camera_access(session, AccessRestrictions(), [camera.mac_address])


async def test_check_camera_access_no_access(
    db_instance: database.Database, organization: Organization, camera: Camera
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        with pytest.raises(fastapi.HTTPException):
            await check_camera_access(
                session, AccessRestrictions(full_access=False), [camera.mac_address]
            )


async def test_get_camera_from_mac_address_or_fail(
    db_instance: database.Database, organization: Organization, camera: Camera
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        camera_ret = await get_camera_from_mac_address_or_fail(
            session, AccessRestrictions(), camera.mac_address
        )
        assert camera_ret.id == camera.id


async def test_get_camera_from_mac_address_or_fail_invalid_mac(
    db_instance: database.Database, organization: Organization, camera: Camera
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        with pytest.raises(fastapi.HTTPException):
            await get_camera_from_mac_address_or_fail(
                session, AccessRestrictions(), "invalid"
            )


async def test_get_camera_from_mac_address_or_fail_no_access(
    db_instance: database.Database, organization: Organization, camera: Camera
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        with pytest.raises(fastapi.HTTPException):
            await get_camera_from_mac_address_or_fail(
                session, AccessRestrictions(full_access=False), camera.mac_address
            )


async def test_get_camera_response_or_fail(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        camera_response = await get_camera_response_from_mac_address_or_fail(
            session, AccessRestrictions(), camera.mac_address
        )
        assert camera_response.camera.id == camera.id


async def test_get_nvr_from_uuid_or_fail(
    db_instance: database.Database, nvr: NVR
) -> None:
    async with db_instance.tenant_session(tenant=nvr.tenant) as session:
        nvr_ret = await get_nvr_from_uuid_or_fail(
            session, AccessRestrictions(), nvr.uuid
        )
        assert nvr_ret.uuid == nvr.uuid


async def test_get_nvr_from_uuid_or_fail_no_access(
    db_instance: database.Database, nvr: NVR
) -> None:
    async with db_instance.tenant_session(tenant=nvr.tenant) as session:
        with pytest.raises(fastapi.HTTPException):
            await get_nvr_from_uuid_or_fail(
                session, AccessRestrictions(full_access=False), nvr.uuid
            )


async def test_get_nvr_from_uuid_or_fail_no_nvr(
    db_instance: database.Database, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        with pytest.raises(fastapi.HTTPException):
            await get_nvr_from_uuid_or_fail(session, AccessRestrictions(), "invalid")


async def test_get_nvr_response_from_uuid_or_fail(
    db_instance: database.Database, nvr: NVR
) -> None:
    async with db_instance.tenant_session(tenant=nvr.tenant) as session:
        nvr_ret = await get_nvr_response_from_uuid_or_fail(
            session, AccessRestrictions(), nvr.uuid
        )
        assert nvr_ret.uuid == nvr.uuid


async def test_get_nvr_response_from_uuid_or_fail_no_access(
    db_instance: database.Database, nvr: NVR
) -> None:
    async with db_instance.tenant_session(tenant=nvr.tenant) as session:
        with pytest.raises(fastapi.HTTPException):
            await get_nvr_response_from_uuid_or_fail(
                session, AccessRestrictions(full_access=False), nvr.uuid
            )


async def test_get_nvr_response_from_uuid_or_fail_no_nvr(
    db_instance: database.Database, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        with pytest.raises(fastapi.HTTPException):
            await get_nvr_response_from_uuid_or_fail(
                session, AccessRestrictions(), "invalid"
            )


async def test_get_nvr_responses_from_uuid_or_fail(
    db_instance: database.Database,
    organization: Organization,
    create_nvr: NVRFactory,
    location: Location,
) -> None:
    nvrs = [await create_nvr(location_id=location.id) for _ in range(3)]

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        nvrs_ret = await get_nvr_responses_from_uuid_or_fail(
            session, AccessRestrictions(), [nvr.uuid for nvr in nvrs]
        )
    assert len(nvrs_ret) == len(nvrs)
    for nvr, nvr_ret in zip(nvrs, nvrs_ret):
        assert nvr_ret.uuid == nvr.uuid


async def test_get_nvr_responses_from_uuid_or_fail_no_access(
    db_instance: database.Database,
    organization: Organization,
    create_nvr: NVRFactory,
    location: Location,
    create_location: LocationFactory,
) -> None:
    nvrs = [await create_nvr(location_id=location.id) for _ in range(3)]
    new_location = await create_location(tenant=organization.tenant)
    nvrs.append(await create_nvr(location_id=new_location.id))

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        with pytest.raises(fastapi.HTTPException):
            await get_nvr_responses_from_uuid_or_fail(
                session,
                AccessRestrictions(full_access=False, location_ids=[location.id]),
                [nvr.uuid for nvr in nvrs],
            )
