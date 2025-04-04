from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import models
from backend.database.orm import orm_organization
from backend.database.orm.orm_utils import Base, TenantProtectedTable
from backend.database.session import TenantAwareAsyncSession


class Feature(Base):
    __tablename__ = "features"
    name = sa.Column(sa.String, nullable=False, primary_key=True)
    default_enabled = sa.Column(sa.Boolean, nullable=False, default=False)

    @staticmethod
    async def system_populate_features(
        session: AsyncSession, enable_all_features: bool
    ) -> None:
        await session.execute(
            postgresql.insert(Feature).on_conflict_do_nothing(),
            [{"name": feature.value} for feature in models.FeatureFlags],
        )
        if enable_all_features:
            await session.execute(sa.update(Feature).values(default_enabled=True))

    @staticmethod
    async def system_get_enabled_features_across_tenants(
        session: AsyncSession, tenants: list[str]
    ) -> list[models.FeatureFlags]:
        stmt = (
            sa.select(Feature.name)
            .join(OrganizationFeature)
            .join(
                orm_organization.Organization,
                OrganizationFeature.tenant == orm_organization.Organization.tenant,
            )
            .where(orm_organization.Organization.tenant.in_(tenants))
        )
        result = await session.execute(stmt)
        organization_features = result.scalars().all()

        default_enabled_features = (
            (
                await session.execute(
                    sa.select(Feature.name).where(Feature.default_enabled.is_(True))
                )
            )
            .scalars()
            .all()
        )

        return [
            models.FeatureFlags(feature)
            for feature in organization_features + default_enabled_features
            if feature in models.FeatureFlags
        ]

    @staticmethod
    async def system_is_feature_enabled_across_tenants(
        session: AsyncSession, feature: models.FeatureFlags, tenants: list[str]
    ) -> bool:
        is_default_enabled = (
            await session.execute(
                sa.select(Feature.name).where(
                    Feature.default_enabled.is_(True), Feature.name == feature.value
                )
            )
        ).one_or_none()
        if is_default_enabled:
            return True

        stmt = sa.select(OrganizationFeature.feature).where(
            OrganizationFeature.tenant.in_(tenants),
            OrganizationFeature.feature == feature.value,
        )
        is_enabled = (await session.execute(stmt)).one_or_none()
        return is_enabled is not None

    @staticmethod
    async def system_default_enable_feature(
        session: AsyncSession, feature: models.FeatureFlags
    ) -> None:
        await session.execute(
            sa.update(Feature)
            .where(Feature.name == feature.name)
            .values(default_enabled=True)
        )

    @staticmethod
    async def system_is_default_feature_enabled(
        session: AsyncSession, feature: models.FeatureFlags
    ) -> bool:
        result = await session.execute(
            sa.select(Feature.default_enabled).where(Feature.name == feature.name)
        )
        return result.scalar_one_or_none() is True


class OrganizationFeature(TenantProtectedTable):
    __tablename__ = "organization_features"
    feature = sa.Column(
        sa.String, sa.ForeignKey("features.name"), nullable=False, primary_key=True
    )

    __table_args__ = ((sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),)

    @staticmethod
    async def new_organization_feature(
        session: TenantAwareAsyncSession, feature: models.FeatureFlags
    ) -> None:
        await session.execute(
            insert(OrganizationFeature)
            .values(feature=feature.value, tenant=session.tenant)
            .on_conflict_do_nothing()
        )

    @staticmethod
    async def delete_organization_feature(
        session: TenantAwareAsyncSession, feature: models.FeatureFlags
    ) -> None:
        await session.execute(
            sa.delete(OrganizationFeature).where(
                sa.and_(OrganizationFeature.feature == feature.value)
            )
        )

    @staticmethod
    async def get_organization_features(
        session: TenantAwareAsyncSession,
    ) -> list[models.FeatureFlags]:
        query = sa.select(OrganizationFeature.feature)
        features = (await session.execute(query)).scalars().all()

        return [
            models.FeatureFlags(feature)
            for feature in features
            if feature in models.FeatureFlags
        ]
