import fastapi
import pytest

from backend.database import database
from backend.database.models import NVR, Camera, Location
from backend.database.organization_models import Organization
from backend.models import AccessRestrictions
from backend.multi_cam_tracking.router_utils import get_nvr_to_mac_addresses_or_fail
from backend.test.factory_types import NVRFactory


async def test_get_nvr_to_mac_addresses_or_fail(
    db_instance: database.Database,
    organization: Organization,
    nvr: NVR,
    camera: Camera,
    location: Location,
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        nvr_to_mac_addresses = await get_nvr_to_mac_addresses_or_fail(
            session, AccessRestrictions(), location.id
        )
        assert len(nvr_to_mac_addresses) == 1
        assert nvr_to_mac_addresses[nvr.uuid] == [camera.mac_address]


async def test_get_nvr_to_mac_addresses_or_fail_no_access(
    db_instance: database.Database, organization: Organization, location: Location
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        with pytest.raises(fastapi.HTTPException):
            await get_nvr_to_mac_addresses_or_fail(
                session, AccessRestrictions(full_access=False), location.id
            )


async def test_get_nvr_to_mac_addresses_or_fail_no_cameras(
    db_instance: database.Database,
    organization: Organization,
    location: Location,
    create_nvr: NVRFactory,
) -> None:
    # create nvr with no cameras and don't create the default camera
    await create_nvr(location_id=location.id)
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        with pytest.raises(fastapi.HTTPException):
            await get_nvr_to_mac_addresses_or_fail(
                session, AccessRestrictions(), location.id
            )
