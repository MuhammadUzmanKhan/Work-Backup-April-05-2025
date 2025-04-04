import pytest_asyncio

from backend.database import database, models, orm
from backend.database.organization_models import Organization


@pytest_asyncio.fixture
async def db_instance_with_features(
    db_instance: database.Database,
) -> database.Database:
    async with db_instance.session() as session:
        await orm.Feature.system_populate_features(session, False)
    return db_instance


async def test_features_disabled(
    db_instance_with_features: database.Database, organization: Organization
) -> None:
    async with db_instance_with_features.session() as session:
        enabled_features = await orm.Feature.system_get_enabled_features_across_tenants(
            session, tenants=[organization.tenant]
        )

        assert enabled_features == []


async def test_feature_enabled(
    db_instance_with_features: database.Database, organization: Organization
) -> None:
    async with db_instance_with_features.session() as session:
        assert (
            await orm.Feature.system_is_default_feature_enabled(
                session, models.FeatureFlags.TEST_FEATURE_FLAG
            )
            is False
        )

        await orm.Feature.system_default_enable_feature(
            session, models.FeatureFlags.TEST_FEATURE_FLAG
        )

        assert (
            await orm.Feature.system_is_default_feature_enabled(
                session, models.FeatureFlags.TEST_FEATURE_FLAG
            )
            is True
        )
        enabled_features = await orm.Feature.system_get_enabled_features_across_tenants(
            session, tenants=[organization.tenant]
        )
        assert enabled_features == [models.FeatureFlags.TEST_FEATURE_FLAG]


async def test_feature_enabled_for_organization(
    db_instance_with_features: database.Database, organization: Organization
) -> None:
    async with db_instance_with_features.tenant_session(
        tenant=organization.tenant
    ) as session:
        await orm.OrganizationFeature.new_organization_feature(
            session, models.FeatureFlags.TEST_FEATURE_FLAG
        )

        enabled_features = await orm.Feature.system_get_enabled_features_across_tenants(
            session, tenants=[organization.tenant]
        )

        assert enabled_features == [models.FeatureFlags.TEST_FEATURE_FLAG]


async def test_feature_disabled_for_organization(
    db_instance_with_features: database.Database, organization: Organization
) -> None:
    async with db_instance_with_features.tenant_session(
        tenant=organization.tenant
    ) as session:
        await orm.OrganizationFeature.new_organization_feature(
            session, models.FeatureFlags.TEST_FEATURE_FLAG
        )

        enabled_features = await orm.Feature.system_get_enabled_features_across_tenants(
            session, tenants=[organization.tenant]
        )
        assert enabled_features == [models.FeatureFlags.TEST_FEATURE_FLAG]

        await orm.OrganizationFeature.delete_organization_feature(
            session, models.FeatureFlags.TEST_FEATURE_FLAG
        )

        enabled_features = await orm.Feature.system_get_enabled_features_across_tenants(
            session, tenants=[organization.tenant]
        )
        assert enabled_features == []


async def test_getting_organization_features(
    db_instance_with_features: database.Database, organization: Organization
) -> None:
    async with db_instance_with_features.tenant_session(
        tenant=organization.tenant
    ) as session:
        await orm.OrganizationFeature.new_organization_feature(
            session, models.FeatureFlags.TEST_FEATURE_FLAG
        )

        org_features = await orm.OrganizationFeature.get_organization_features(session)

        assert org_features == [models.FeatureFlags.TEST_FEATURE_FLAG]
