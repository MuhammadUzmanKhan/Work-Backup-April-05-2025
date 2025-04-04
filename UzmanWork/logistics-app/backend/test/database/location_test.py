import pytest

from backend.database import database, orm
from backend.database.models import NVR, CameraGroup, Location, LocationCreate
from backend.database.organization_models import Organization
from backend.models import AccessRestrictions, CameraGroupRestriction
from backend.test.factory_types import LocationFactory, RandomStringFactory


async def test_new_location(
    db_instance: database.Database,
    organization: Organization,
    create_name: RandomStringFactory,
) -> None:
    location_name = create_name()
    location_address = create_name()
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.Location.new_location(
            session, LocationCreate(name=location_name, address=location_address)
        )
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        locations = await orm.Location.get_locations_info(session, AccessRestrictions())
    assert len(locations) == 1
    assert locations[0].name == location_name
    assert locations[0].address == location_address


async def test_new_location_with_invalid_name(
    db_instance: database.Database,
    organization: Organization,
    create_name: RandomStringFactory,
) -> None:
    invalid_location_name = ""
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        with pytest.raises(ValueError):
            await orm.Location.new_location(
                session,
                LocationCreate(name=invalid_location_name, address=create_name()),
            )


async def test_new_location_with_invalid_address(
    db_instance: database.Database,
    organization: Organization,
    create_name: RandomStringFactory,
) -> None:
    invalid_location_address = "abcd"
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        with pytest.raises(ValueError):
            await orm.Location.new_location(
                session,
                LocationCreate(name=create_name(), address=invalid_location_address),
            )


async def test_location_owner(
    db_instance: database.Database, location: Location, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        # Location 1 got the name "tenant" in the organization fixture.
        owner_1 = await orm.Location.get_location_owner(session, location.id)
        assert owner_1 is not None and owner_1.tenant == organization.tenant

        # There is no location with ID 2, expect None owner.
        owner_2 = await orm.Location.get_location_owner(session, location.id + 1)
        assert owner_2 is None
        assert owner_2 is None


async def test_get_locations_info(
    db_instance: database.Database, organization: Organization, location: Location
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        locations = await orm.Location.get_locations_info(session, AccessRestrictions())
    assert len(locations) == 1
    assert locations[0].name == location.name


async def test_get_locations_info_full_access(
    db_instance: database.Database, organization: Organization, location: Location
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        locations = await orm.Location.get_locations_info(
            session, AccessRestrictions(full_access=True)
        )
        assert len(locations) == 1

        locations = await orm.Location.get_locations_info(
            session, AccessRestrictions(full_access=False)
        )
        assert len(locations) == 0


async def test_get_locations_info_location_access(
    db_instance: database.Database, organization: Organization, location: Location
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        locations = await orm.Location.get_locations_info(
            session, AccessRestrictions(full_access=False, location_ids=[location.id])
        )
        assert len(locations) == 1

        locations = await orm.Location.get_locations_info(
            session,
            AccessRestrictions(full_access=False, location_ids=[location.id + 1]),
        )
        assert len(locations) == 0


async def test_get_locations_info_group_access_through_group(
    db_instance: database.Database,
    organization: Organization,
    location: Location,
    camera_group: CameraGroup,
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        locations = await orm.Location.get_locations_info(
            session,
            AccessRestrictions(
                full_access=False,
                camera_groups=[
                    CameraGroupRestriction(
                        location_id=location.id, camera_group_id=camera_group.id
                    )
                ],
            ),
        )
        assert len(locations) == 1


async def test_get_locations_info_group_access_through_location(
    db_instance: database.Database, organization: Organization, location: Location
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        locations = await orm.Location.get_locations_info(
            session, AccessRestrictions(full_access=False, location_ids=[location.id])
        )
        assert len(locations) == 1


async def test_get_locations_info_group_access_no_location_access(
    db_instance: database.Database,
    organization: Organization,
    location: Location,
    camera_group: CameraGroup,
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        locations = await orm.Location.get_locations_info(
            session,
            AccessRestrictions(
                full_access=False,
                camera_groups=[
                    CameraGroupRestriction(
                        location_id=location.id + 1, camera_group_id=camera_group.id
                    )
                ],
            ),
        )
        assert len(locations) == 0


async def test_get_nvr_location(
    db_instance: database.Database,
    organization: Organization,
    location: Location,
    nvr: NVR,
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        nvr_location = await orm.Location.get_nvr_location(
            session, AccessRestrictions(), nvr.uuid
        )
        assert nvr_location is not None
        assert nvr_location.id == location.id


async def test_get_nvr_location_multiple(
    db_instance: database.Database,
    organization: Organization,
    location: Location,
    create_location: LocationFactory,
    nvr: NVR,
) -> None:
    # Create a second location for the same tenant
    # we should still only get one.
    await create_location(organization.tenant)
    async with db_instance.tenant_session(organization.tenant) as session:
        nvr_location = await orm.Location.get_nvr_location(
            session, AccessRestrictions(), nvr.uuid
        )
        assert nvr_location is not None
        assert nvr_location.id == location.id


async def test_update_location_name(
    db_instance: database.Database,
    organization: Organization,
    location: Location,
    create_name: RandomStringFactory,
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        location_name = create_name()
        await orm.Location.update_location_name(
            session, AccessRestrictions(), location.id, location_name
        )
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        locations = await orm.Location.get_locations_info(session, AccessRestrictions())
    assert len(locations) == 1
    assert locations[0].name == location_name


async def test_update_location_address(
    db_instance: database.Database,
    organization: Organization,
    location: Location,
    create_name: RandomStringFactory,
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        location_address = create_name()
        await orm.Location.update_location_address(
            session, AccessRestrictions(), location.id, location_address
        )
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        locations = await orm.Location.get_locations_info(session, AccessRestrictions())
    assert len(locations) == 1
    assert locations[0].address == location_address
