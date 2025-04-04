from backend.constants import UNASSIGNED_TENANT
from backend.database import database, orm
from backend.database.models import NVR, Location, NVRCreate
from backend.database.organization_models import Organization
from backend.models import AccessRestrictions
from backend.test.factory_types import (
    LocationFactory,
    NVRFactory,
    OrganizationFactory,
    RandomStringFactory,
)
from backend.utils import AwareDatetime


async def test_new_nvr(
    db_instance: database.Database,
    location: Location,
    create_name: RandomStringFactory,
    organization: Organization,
) -> None:
    nvr_uuid = create_name()
    async with db_instance.session() as session:
        nvr = await orm.NVR.system_new_nvr(
            session,
            NVRCreate(
                uuid=nvr_uuid,
                location_id=location.id,
                last_seen_time=AwareDatetime.utcnow(),
            ),
        )
        # We need to associate it with some tenant, otherwise it won't be returned
        # in tenant-scoped sessions
        nvr.tenant = organization.tenant

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        nvrs = await orm.NVR.get_nvrs(session, access=AccessRestrictions())
    assert len(nvrs) == 1
    assert nvrs[0].uuid == nvr_uuid


async def test_get_nvrs_filter_by_tenant(
    db_instance: database.Database,
    create_organization: OrganizationFactory,
    create_location: LocationFactory,
    create_nvr: NVRFactory,
) -> None:
    organization = await create_organization()
    location = await create_location(organization.tenant)
    nvr = await create_nvr(location.id, tenant=organization.tenant)
    second_organization = await create_organization()
    second_location = await create_location(second_organization.tenant)
    second_nvr = await create_nvr(second_location.id, tenant=second_organization.tenant)

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        nvrs = await orm.NVR.get_nvrs(session, access=AccessRestrictions())
        assert len(nvrs) == 1
        assert nvrs[0].uuid == nvr.uuid

    async with db_instance.tenant_session(tenant=second_organization.tenant) as session:
        nvrs = await orm.NVR.get_nvrs(session, access=AccessRestrictions())
        assert len(nvrs) == 1
        assert nvrs[0].uuid == second_nvr.uuid


async def test_get_nvrs_filter_by_location(
    db_instance: database.Database,
    organization: Organization,
    create_location: LocationFactory,
    create_nvr: NVRFactory,
) -> None:
    location = await create_location(organization.tenant)
    nvr = await create_nvr(location.id)
    second_location = await create_location(organization.tenant)
    second_nvr = await create_nvr(second_location.id)

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        nvrs = await orm.NVR.get_nvrs(
            session, access=AccessRestrictions(), location_id=location.id
        )
        assert len(nvrs) == 1
        assert nvrs[0].uuid == nvr.uuid

        nvrs = await orm.NVR.get_nvrs(
            session, access=AccessRestrictions(), location_id=second_location.id
        )
        assert len(nvrs) == 1
        assert nvrs[0].uuid == second_nvr.uuid


async def test_get_nvrs_filter_by_uuid(
    db_instance: database.Database,
    location: Location,
    create_nvr: NVRFactory,
    organization: Organization,
) -> None:
    nvr = await create_nvr(location.id)
    second_nvr = await create_nvr(location.id)

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        nvr_ret = await orm.NVR.get_nvr_by_uuid(session, nvr.uuid, AccessRestrictions())
        assert nvr_ret is not None
        nvr_ret = await orm.NVR.get_nvr_by_uuid(
            session, second_nvr.uuid, AccessRestrictions()
        )
        assert nvr_ret is not None


async def test_get_nvrs_unknown_unassigned(
    db_instance: database.Database, organization: Organization, create_nvr: NVRFactory
) -> None:
    await create_nvr(None)
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        nvrs = await orm.NVR.get_nvrs(session, access=AccessRestrictions())
    assert len(nvrs) == 0


async def test_validate_unassigned_nvr_code_succeeds(
    db_instance: database.Database, create_nvr: NVRFactory
) -> None:
    nvr = await create_nvr(None)
    async with db_instance.session() as session:
        assert await orm.NVR.system_validate_nvr_code(session, nvr.uuid) is True


async def test_validate_assigned_nvr_code_fails(
    db_instance: database.Database, nvr: NVR
) -> None:
    async with db_instance.session() as session:
        assert await orm.NVR.system_validate_nvr_code(session, nvr.uuid) is False


async def test_register_nvr_with_location(
    db_instance: database.Database, nvr: NVR, organization: Organization
) -> None:
    async with db_instance.session() as session:
        assert nvr.location_id
        assert (
            await orm.NVR.system_register_nvr(
                session, nvr.uuid, nvr.location_id, organization.tenant
            )
            is True
        )


async def test_register_nvr_no_location(
    db_instance: database.Database,
    create_nvr: NVRFactory,
    location: Location,
    organization: Organization,
) -> None:
    nvr = await create_nvr(None)
    async with db_instance.session() as session:
        assert nvr.location_id is None
        assert (
            await orm.NVR.system_register_nvr(
                session, nvr.uuid, location.id, organization.tenant
            )
            is True
        )


async def test_system_get_owner_assigned_nvr(
    db_instance: database.Database, nvr: NVR
) -> None:
    async with db_instance.session() as session:
        org = await orm.NVR.system_get_owner(session, nvr.uuid)
    assert org is not None


async def test_system_get_owner_unassigned_nvr(
    db_instance: database.Database,
    create_name: RandomStringFactory,
    create_nvr: NVRFactory,
) -> None:
    nvr_uuid = create_name()
    await create_nvr(None, nvr_uuid, None, UNASSIGNED_TENANT)

    async with db_instance.session() as session:
        org = await orm.NVR.system_get_owner(session, nvr_uuid)
    assert org is None


async def test_update_nvr_location(
    db_instance: database.Database, nvr: NVR, location: Location
) -> None:
    async with db_instance.tenant_session(nvr.tenant) as session:
        assert await orm.NVR.update_nvr_location(session, nvr.uuid, location.id)
