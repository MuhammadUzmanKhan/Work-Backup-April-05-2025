from backend.database import database, orm
from backend.database.models import Location
from backend.database.organization_models import Organization
from backend.models import AccessRestrictions
from backend.test.factory_types import NVRFactory


async def test_system_update_always_on_retention_config(
    db_instance: database.Database, organization: Organization
) -> None:
    new_retention_hours = 24

    async with db_instance.session() as session:
        await orm.Organization.system_update_always_on_retention_config(
            session,
            tenant=organization.tenant,
            retention_hours_always_on_streams=new_retention_hours,
        )

        retention_hours = await orm.Organization.system_get_org_streams_retention(
            session, tenant=organization.tenant
        )

        assert retention_hours == new_retention_hours


async def test_system_update_nvr_retention(
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
    async with db_instance.session() as session:
        assert await orm.NVR.system_update_nvr_retention(session, nvr.uuid, 5) is True

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        nvrs = await orm.NVR.get_nvrs(session, access=AccessRestrictions())
        assert len(nvrs) == 1
        assert nvrs[0].retention_days == 5
