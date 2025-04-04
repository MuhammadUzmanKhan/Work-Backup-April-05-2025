from __future__ import annotations

from typing import cast

import sqlalchemy as sa
from sqlalchemy import orm

from backend.database import models, organization_models
from backend.database.orm import orm_nvr, orm_organization
from backend.database.orm.orm_utils import TenantProtectedTable
from backend.database.session import TenantAwareAsyncSession
from backend.models import AccessRestrictions


class LocationError(Exception):
    pass


class LocationNotFoundError(LocationError):
    pass


class LocationTimezoneUpdateIsNotAllowed(LocationError):
    pass


class LocationWithNvrsDeleteNotAllowed(LocationError):
    pass


class LocationNameAlreadyExists(LocationError):
    pass


def generate_access_statement(
    access: AccessRestrictions | None,
) -> sa.sql.ClauseElement:
    # NOTE(@lberg): we should not force a join here
    # but we have to because we use the org_id in location
    if access is None or access.full_access:
        return sa.true()
    else:
        return Location.id.in_(
            access.location_ids + [group.location_id for group in access.camera_groups]
        )


class Location(TenantProtectedTable):
    __tablename__ = "locations"
    id: orm.Mapped[int] = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    # The name of the location
    name = sa.Column(sa.String, nullable=False)
    # Address of the location
    address = sa.Column(sa.String, nullable=False)
    # Latitude of the location (to show on a map)
    address_lat = sa.Column(sa.Float, nullable=True)
    # Longitude of the location (to show on a map)
    address_lon = sa.Column(sa.Float, nullable=True)
    enable_setting_timezone = sa.Column(
        sa.Boolean, nullable=False, default=False, server_default=sa.text("false")
    )
    timezone = sa.Column(
        sa.String,
        nullable=False,
        default="America/Los_Angeles",
        server_default="America/Los_Angeles",
    )

    __table_args__ = (
        (sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),
        sa.UniqueConstraint(name, "tenant"),
    )

    @staticmethod
    async def new_location(
        session: TenantAwareAsyncSession, location_metadata: models.LocationCreate
    ) -> Location:
        """Add new location to the database."""
        location = Location(
            name=location_metadata.name,
            address=location_metadata.address,
            address_lat=location_metadata.address_lat,
            address_lon=location_metadata.address_lon,
            tenant=session.tenant,
        )
        session.add(location)
        try:
            await session.flush()
        except sa.exc.IntegrityError as e:
            if (
                "duplicate key value violates unique constraint"
                ' "uc_locations_name_tenant_key"' in str(e)
            ):
                raise LocationNameAlreadyExists(
                    f"Location with name {location_metadata.name} already exists"
                )
            else:
                raise
        return location

    @staticmethod
    async def get_location_owner(
        session: TenantAwareAsyncSession, location_id: int
    ) -> organization_models.Organization | None:
        query = (
            sa.select(orm_organization.Organization)
            .join(Location, Location.tenant == orm_organization.Organization.tenant)
            .where(Location.id == location_id)
        )
        result = await session.execute(query)
        row = result.first()
        return (
            organization_models.Organization.from_orm(row.Organization)
            if row is not None
            else None
        )

    @staticmethod
    async def get_locations_info(
        session: TenantAwareAsyncSession, access_restrictions: AccessRestrictions
    ) -> list[models.Location]:
        where_clauses = [generate_access_statement(access_restrictions)]
        stmt = (
            sa.select(Location)
            .join(
                orm_organization.Organization,
                Location.tenant == orm_organization.Organization.tenant,
            )
            .where(*where_clauses)
        )
        result = await session.execute(stmt)
        locations = result.scalars().all()
        return [models.Location.from_orm(location) for location in locations]

    @staticmethod
    async def get_nvr_location(
        session: TenantAwareAsyncSession,
        access_restrictions: AccessRestrictions,
        nvr_uuid: str,
    ) -> models.Location | None:
        stmt = (
            sa.select(Location)
            .join(
                orm_organization.Organization,
                Location.tenant == orm_organization.Organization.tenant,
            )
            .join(orm_nvr.NVR, Location.id == orm_nvr.NVR.location_id)
            .where(
                orm_nvr.NVR.uuid == nvr_uuid,
                generate_access_statement(access_restrictions),
            )
        )
        result = await session.execute(stmt)
        location = result.scalars().one_or_none()
        return location if location is None else models.Location.from_orm(location)

    @staticmethod
    async def update_location_name(
        session: TenantAwareAsyncSession,
        access_restrictions: AccessRestrictions,
        location_id: int,
        name: str,
    ) -> None:
        location = await Location._get_location_for_update(
            session, access_restrictions, location_id
        )
        location.name = name

    @staticmethod
    async def update_location_address(
        session: TenantAwareAsyncSession,
        access_restrictions: AccessRestrictions,
        location_id: int,
        address: str,
    ) -> None:
        location = await Location._get_location_for_update(
            session, access_restrictions, location_id
        )
        location.address = address

    @staticmethod
    async def update_location_enable_setting_timezone(
        session: TenantAwareAsyncSession,
        access_restrictions: AccessRestrictions,
        location_id: int,
        enable_setting_timezone: bool,
    ) -> None:
        location = await Location._get_location_for_update(
            session, access_restrictions, location_id
        )
        location.enable_setting_timezone = enable_setting_timezone

    @staticmethod
    async def update_location_timezone(
        session: TenantAwareAsyncSession,
        access_restrictions: AccessRestrictions,
        location_id: int,
        timezone: str,
    ) -> None:
        location = await Location._get_location_for_update(
            session, access_restrictions, location_id
        )
        if not location.enable_setting_timezone:
            raise LocationTimezoneUpdateIsNotAllowed(
                "Cannot update timezone for location with disabled timezone setting"
                " management"
            )

        location.timezone = timezone

    @staticmethod
    async def get_location_by_nvr(
        session: TenantAwareAsyncSession, nvr_uuid: str
    ) -> Location | None:
        location_query = (
            sa.select(Location)
            .join(orm_nvr.NVR, orm_nvr.NVR.location_id == Location.id)
            .where(orm_nvr.NVR.uuid == nvr_uuid)
        )
        location_result = await session.execute(location_query)
        location = location_result.scalar()
        return cast(Location, location) if location is not None else None

    @staticmethod
    async def reset_location_timezone_to_the_first_associated_nvr(
        session: TenantAwareAsyncSession, location_id: int
    ) -> None:
        nvr_timezone_subquery = (
            sa.select(orm_nvr.NVR.timezone)
            .where(orm_nvr.NVR.location_id == location_id)
            .order_by(orm_nvr.NVR.id)
            .limit(1)
            .scalar_subquery()
        )
        update_query = (
            sa.update(Location)
            .where(Location.id == location_id)
            .values(timezone=sa.func.coalesce(nvr_timezone_subquery, Location.timezone))
        )
        await session.execute(update_query)

    @staticmethod
    async def _get_location_for_update(
        session: TenantAwareAsyncSession,
        access_restrictions: AccessRestrictions,
        location_id: int,
    ) -> Location:
        query = (
            sa.select(Location)
            .join(
                orm_organization.Organization,
                orm_organization.Organization.tenant == Location.tenant,
            )
            .where(
                Location.id == location_id,
                generate_access_statement(access_restrictions),
            )
        )
        result = await session.execute(query)
        location = result.scalars().one_or_none()

        if location is None:
            raise LocationNotFoundError()

        return cast(Location, location)

    @staticmethod
    async def delete_location(
        session: TenantAwareAsyncSession, location_id: int
    ) -> None:
        # if there is an NVR associated with the location, raise an error
        nvr_count_query = (
            sa.select(sa.func.count())
            .select_from(orm_nvr.NVR)
            .where(orm_nvr.NVR.location_id == location_id)
        )
        nvr_count = cast(int, (await session.execute(nvr_count_query)).scalar_one())

        if nvr_count > 0:
            raise LocationWithNvrsDeleteNotAllowed(
                f"Cannot delete location {location_id=} with associated {nvr_count} NVR"
            )

        await session.execute(sa.delete(Location).where(Location.id == location_id))
