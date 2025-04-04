import pytest

from backend.database import database, orm
from backend.database.organization_models import Organization
from backend.database.orm.orm_tag import TagError
from backend.test.factory_types import OrganizationFactory


async def test_create_tag_with_duplicate_name(
    db_instance: database.Database, organization: Organization
) -> None:
    tag_name = "Test Tag"
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.Tag.create_tag(session, tag_name)
        with pytest.raises(TagError):
            await orm.Tag.create_tag(session, tag_name)


async def test_create_tag_with_duplicate_name_but_different_case(
    db_instance: database.Database, organization: Organization
) -> None:
    tag_name = "Test Tag"
    tag_name_different_case = "test tag"
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.Tag.create_tag(session, tag_name)
        with pytest.raises(TagError):
            await orm.Tag.create_tag(session, tag_name_different_case)


async def test_create_tag_with_duplicate_name_within_another_org(
    db_instance: database.Database,
    organization: Organization,
    create_organization: OrganizationFactory,
) -> None:
    tag_name = "Test Tag"
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.Tag.create_tag(session, tag_name)

    second_org = await create_organization()
    async with db_instance.tenant_session(tenant=second_org.tenant) as session:
        await orm.Tag.create_tag(session, tag_name)
