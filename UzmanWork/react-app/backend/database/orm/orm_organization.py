from __future__ import annotations

from typing import Any

import pydantic
import sqlalchemy as sa
from sqlalchemy import orm
from sqlalchemy.ext.asyncio import AsyncSession

from backend.constants import UNASSIGNED_TENANT
from backend.database import organization_models
from backend.database.network_scan_models import NetworkScanSettings
from backend.database.orm.orm_utils import TenantProtectedTable
from backend.database.session import TenantAwareAsyncSession


class Organization(TenantProtectedTable):
    __tablename__ = "organizations"
    id: orm.Mapped[int] = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    tenant = sa.Column(sa.String, nullable=False, unique=True)
    # Human readable name of the organization
    name = sa.Column(sa.String, nullable=False)
    # Retention hours for always-on streams
    retention_hours_always_on_streams = sa.Column(
        sa.Integer, nullable=False, default=1, server_default=sa.text("1")
    )
    inactive_user_logout_enabled = sa.Column(
        sa.Boolean, nullable=False, server_default=sa.sql.false(), default=False
    )
    # Bitrate in kbps for low res streams
    low_res_bitrate_kbps = sa.Column(
        sa.Integer, nullable=False, default=512, server_default=sa.text("512")
    )
    cameras_audio_settings = sa.Column(
        sa.String,
        nullable=False,
        default=organization_models.OrgCamerasAudioSettings.DISABLED.value,
        server_default=sa.text(
            f"'{organization_models.OrgCamerasAudioSettings.DISABLED.value}'"
        ),
    )
    cameras_webrtc_settings = sa.Column(
        sa.String,
        nullable=False,
        default=organization_models.OrgCamerasWebRTCSettings.DISABLED.value,
        server_default=sa.text(
            f"'{organization_models.OrgCamerasWebRTCSettings.DISABLED.value}'"
        ),
    )
    # This is the number of cameras that the organization is licensed for
    number_licensed_cameras = sa.Column(
        sa.Integer, nullable=True, default=None, server_default=sa.text("NULL")
    )
    # network scan settings as a JSON string
    network_scan_settings = sa.Column(
        sa.JSON, nullable=False, default=sa.text('\'{"mode": "auto"}\'::jsonb')
    )

    @staticmethod
    async def system_new_organization(
        session: AsyncSession,
        organization_metadata: organization_models.OrganizationCreate,
    ) -> Organization:
        organization = Organization(
            name=organization_metadata.name, tenant=organization_metadata.tenant
        )
        session.add(organization)
        return organization

    @staticmethod
    async def _update_field(
        session: TenantAwareAsyncSession, field_name: str, field_value: Any
    ) -> bool:
        query = sa.update(Organization).values(**{field_name: field_value})
        result = await session.execute(query)
        return bool(result.rowcount == 1)  # type: ignore[attr-defined]

    @staticmethod
    async def system_update_always_on_retention_config(
        session: AsyncSession, tenant: str, retention_hours_always_on_streams: int
    ) -> bool:
        query = (
            sa.update(Organization)
            .where(Organization.tenant == tenant)
            .values(retention_hours_always_on_streams=retention_hours_always_on_streams)
        )
        result = await session.execute(query)
        return bool(result.rowcount == 1)  # type: ignore[attr-defined]

    @staticmethod
    async def update_low_res_bitrate(
        session: TenantAwareAsyncSession, low_res_bitrate_kbps: int
    ) -> bool:
        return await Organization._update_field(
            session=session,
            field_name="low_res_bitrate_kbps",
            field_value=low_res_bitrate_kbps,
        )

    @staticmethod
    async def update_inactive_user_logout(
        session: TenantAwareAsyncSession, inactive_user_logout_enabled: bool
    ) -> bool:
        return await Organization._update_field(
            session=session,
            field_name="inactive_user_logout_enabled",
            field_value=inactive_user_logout_enabled,
        )

    @staticmethod
    async def update_cameras_audio_settings(
        session: TenantAwareAsyncSession,
        cameras_audio_settings: organization_models.OrgCamerasAudioSettings,
    ) -> bool:
        return await Organization._update_field(
            session=session,
            field_name="cameras_audio_settings",
            field_value=cameras_audio_settings.value,
        )

    @staticmethod
    async def update_cameras_webrtc_settings(
        session: TenantAwareAsyncSession,
        cameras_webrtc_settings: organization_models.OrgCamerasWebRTCSettings,
    ) -> bool:
        return await Organization._update_field(
            session=session,
            field_name="cameras_webrtc_settings",
            field_value=cameras_webrtc_settings.value,
        )

    @staticmethod
    async def update_number_licensed_cameras(
        session: TenantAwareAsyncSession, number_licensed_cameras: int | None
    ) -> bool:
        return await Organization._update_field(
            session=session,
            field_name="number_licensed_cameras",
            field_value=number_licensed_cameras,
        )

    @staticmethod
    async def system_get_org_streams_retention(
        session: AsyncSession, tenant: str
    ) -> int | None:
        """Get the retention hours for always-on streams for the specified org."""
        query = sa.select(Organization.retention_hours_always_on_streams).where(
            Organization.tenant == tenant
        )
        result = await session.execute(query)
        retention_hours_always_on_streams = result.scalars().one_or_none()
        return (
            None
            if retention_hours_always_on_streams is None
            else int(retention_hours_always_on_streams)
        )

    @staticmethod
    async def get_org(
        session: TenantAwareAsyncSession,
    ) -> organization_models.Organization | None:
        query = sa.select(Organization)
        result = await session.execute(query)
        org = result.scalars().one_or_none()
        return organization_models.Organization.from_orm(org) if org else None

    @staticmethod
    async def get_org_number_licensed_cameras(
        session: TenantAwareAsyncSession,
    ) -> int | None:
        query = sa.select(Organization.number_licensed_cameras)
        result = await session.execute(query)
        number_licensed_cameras = result.scalars().one_or_none()
        return number_licensed_cameras

    @staticmethod
    async def get_org_name_or_unknown_from_session(
        session: TenantAwareAsyncSession,
    ) -> str:
        org = await Organization.get_org(session)
        if org is None:
            return "Unknown"

        return org.name

    @staticmethod
    async def system_get_orgs(
        session: AsyncSession, tenants: list[str] | None = None
    ) -> list[organization_models.Organization]:
        """
        Get the list of all the organizations optionally filtered by tenants
        """
        where_clause: sa.sql.ClauseElement = sa.true()
        if tenants:
            where_clause = Organization.tenant.in_(tenants)
        query = sa.select(Organization).where(where_clause)
        result = await session.execute(query)
        orgs = result.scalars().all()
        return [organization_models.Organization.from_orm(org) for org in orgs]

    @staticmethod
    async def system_get_tenants(session: AsyncSession) -> list[str]:
        query = sa.select(Organization.tenant).where(
            Organization.tenant != UNASSIGNED_TENANT
        )
        result = await session.execute(query)
        tenants = result.scalars().all()
        return tenants

    @staticmethod
    async def get_network_scan_settings(
        session: TenantAwareAsyncSession,
    ) -> NetworkScanSettings | None:
        query = sa.select(Organization.network_scan_settings)
        res = (await session.execute(query)).scalar_one_or_none()
        if res is None:
            return None
        return pydantic.parse_obj_as(NetworkScanSettings, res)  # type: ignore[arg-type] # noqa E501

    @staticmethod
    async def update_network_scan_settings(
        session: TenantAwareAsyncSession, network_scan_settings: NetworkScanSettings
    ) -> bool:
        return await Organization._update_field(
            session=session,
            field_name="network_scan_settings",
            field_value=network_scan_settings.dict(),
        )
