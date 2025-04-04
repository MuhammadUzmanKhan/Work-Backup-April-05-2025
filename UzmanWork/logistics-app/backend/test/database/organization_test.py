from backend.database import database, orm
from backend.database.organization_models import Organization, OrganizationCreate
from backend.test.factory_types import RandomStringFactory


async def test_new_organization(
    db_instance: database.Database, create_name: RandomStringFactory
) -> None:
    name = create_name()
    tenant = create_name()
    async with db_instance.session() as session:
        await orm.Organization.system_new_organization(
            session, OrganizationCreate(tenant=tenant, name=name)
        )
    async with db_instance.tenant_session(tenant=tenant) as session:
        organization = await orm.Organization.get_org(session)
        assert organization is not None


async def test_system_get_orgs(
    db_instance: database.Database, organization: Organization
) -> None:
    async with db_instance.session() as session:
        orgs = await orm.Organization.system_get_orgs(session, [organization.tenant])
    assert len(orgs) == 1
    assert orgs[0].id == organization.id


async def test_get_org(
    db_instance: database.Database, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        org = await orm.Organization.get_org(session)
    assert org is not None
    assert org.id == organization.id


async def test_get_org_streams_retention(
    db_instance: database.Database, organization: Organization
) -> None:
    async with db_instance.session() as session:
        retention_hours = await orm.Organization.system_get_org_streams_retention(
            session, tenant=organization.tenant
        )
        assert retention_hours == organization.retention_hours_always_on_streams
