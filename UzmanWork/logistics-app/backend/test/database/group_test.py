import pytest
import pytest_asyncio
from sqlalchemy.exc import IntegrityError

from backend.database import database, orm
from backend.database.models import CameraGroup, CameraGroupCreate, Location
from backend.database.organization_models import Organization
from backend.models import AccessRestrictions, CameraGroupRestriction
from backend.test.factory_types import (
    CameraFactory,
    CameraGroupFactory,
    LocationFactory,
    NVRFactory,
    OrganizationFactory,
    RandomStringFactory,
)


async def test_new_group(
    db_instance: database.Database,
    create_name: RandomStringFactory,
    organization: Organization,
) -> None:
    group_name = create_name()
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.CameraGroup.new_group(
            session, CameraGroupCreate(name=group_name, is_default=False)
        )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        groups = await orm.CameraGroup.get_allowed_groups(session, AccessRestrictions())
    assert len(groups) == 1
    assert groups[0].name == group_name


async def test_only_one_default(
    db_instance: database.Database,
    create_name: RandomStringFactory,
    organization: Organization,
) -> None:
    with pytest.raises(IntegrityError):
        async with db_instance.tenant_session(tenant=organization.tenant) as session:
            await orm.CameraGroup.new_group(
                session, CameraGroupCreate(name=create_name(), is_default=True)
            )
            await orm.CameraGroup.new_group(
                session, CameraGroupCreate(name=create_name(), is_default=True)
            )


async def test_allowed_groups(
    db_instance: database.Database,
    create_organization: OrganizationFactory,
    create_camera_group: CameraGroupFactory,
) -> None:
    organization = await create_organization()
    camera_group = await create_camera_group(organization.tenant)

    second_organization = await create_organization()
    second_camera_group = await create_camera_group(second_organization.tenant)

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        allowed_groups = await orm.CameraGroup.get_allowed_groups(
            session, AccessRestrictions()
        )
    assert len(allowed_groups) == 1
    assert allowed_groups[0].id == camera_group.id

    async with db_instance.tenant_session(tenant=second_organization.tenant) as session:
        allowed_groups = await orm.CameraGroup.get_allowed_groups(
            session, AccessRestrictions()
        )
    assert len(allowed_groups) == 1
    assert allowed_groups[0].id == second_camera_group.id


async def test_allowed_groups_full_access(
    db_instance: database.Database,
    organization: Organization,
    camera_group: CameraGroup,
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        allowed_groups = await orm.CameraGroup.get_allowed_groups(
            session, AccessRestrictions(full_access=True)
        )
        assert len(allowed_groups) == 1

        allowed_groups = await orm.CameraGroup.get_allowed_groups(
            session, AccessRestrictions(full_access=False)
        )
        assert len(allowed_groups) == 0


async def test_allowed_groups_location_access(
    db_instance: database.Database,
    organization: Organization,
    location: Location,
    camera_group: CameraGroup,
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        allowed_groups = await orm.CameraGroup.get_allowed_groups(
            session, AccessRestrictions(full_access=False, location_ids=[location.id])
        )
        assert len(allowed_groups) == 1


async def test_allowed_groups_group_access(
    db_instance: database.Database,
    organization: Organization,
    location: Location,
    camera_group: CameraGroup,
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        allowed_groups = await orm.CameraGroup.get_allowed_groups(
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
        assert len(allowed_groups) == 1

        allowed_groups = await orm.CameraGroup.get_allowed_groups(
            session,
            AccessRestrictions(
                full_access=False,
                camera_groups=[
                    CameraGroupRestriction(
                        location_id=location.id, camera_group_id=camera_group.id + 1
                    )
                ],
            ),
        )
        assert len(allowed_groups) == 0


GroupLocationPair = tuple[CameraGroup, Location]


@pytest_asyncio.fixture
async def two_groups_one_valid(
    organization: Organization,
    create_camera_group: CameraGroupFactory,
    create_location: LocationFactory,
    create_nvr: NVRFactory,
    create_camera: CameraFactory,
) -> GroupLocationPair:
    camera_group = await create_camera_group(organization.tenant)
    location = await create_location(organization.tenant)
    nvr = await create_nvr(location.id)
    await create_camera(camera_group.id, nvr.uuid)

    await create_camera_group(organization.tenant)
    second_location = await create_location(organization.tenant)
    await create_nvr(second_location.id)
    return (camera_group, location)


async def test_get_group_with_location(
    db_instance: database.Database,
    organization: Organization,
    two_groups_one_valid: GroupLocationPair,
) -> None:
    (camera_group, location) = two_groups_one_valid

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        groups = await orm.CameraGroup.get_groups_with_location(
            session, AccessRestrictions()
        )
        assert len(groups) == 1
        assert groups[0].id == camera_group.id
        assert groups[0].location_ids == {location.id}


async def test_get_group_with_location_full_access(
    db_instance: database.Database,
    organization: Organization,
    two_groups_one_valid: GroupLocationPair,
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        groups = await orm.CameraGroup.get_groups_with_location(
            session, AccessRestrictions(full_access=True)
        )
        assert len(groups) == 1

        groups = await orm.CameraGroup.get_groups_with_location(
            session, AccessRestrictions(full_access=False)
        )
        assert len(groups) == 0


async def test_get_group_with_location_location_access(
    db_instance: database.Database,
    organization: Organization,
    two_groups_one_valid: GroupLocationPair,
) -> None:
    (_, location) = two_groups_one_valid
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        groups = await orm.CameraGroup.get_groups_with_location(
            session, AccessRestrictions(full_access=False, location_ids=[location.id])
        )
        assert len(groups) == 1

        groups = await orm.CameraGroup.get_groups_with_location(
            session,
            AccessRestrictions(full_access=False, location_ids=[location.id + 1]),
        )
        assert len(groups) == 0


async def test_get_group_with_location_group_access(
    db_instance: database.Database,
    organization: Organization,
    two_groups_one_valid: GroupLocationPair,
) -> None:
    (camera_group, location) = two_groups_one_valid
    for location_id, camera_group_id, expected_length in [
        (location.id, camera_group.id, 1),
        (location.id + 1, camera_group.id, 0),
        (location.id, camera_group.id + 1, 0),
    ]:
        async with db_instance.tenant_session(tenant=organization.tenant) as session:
            groups = await orm.CameraGroup.get_groups_with_location(
                session,
                AccessRestrictions(
                    full_access=False,
                    camera_groups=[
                        CameraGroupRestriction(
                            location_id=location_id, camera_group_id=camera_group_id
                        )
                    ],
                ),
            )
            assert len(groups) == expected_length
