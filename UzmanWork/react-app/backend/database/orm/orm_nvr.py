from __future__ import annotations

import logging.config
from typing import Any

import sqlalchemy as sa
from pydantic import ValidationError
from sqlalchemy import func, orm
from sqlalchemy.ext.asyncio import AsyncSession

from backend import logging_config
from backend.constants import (
    DEFAULT_MAX_NUM_CAMERA_SLOTS_NVR,
    NVR_ONLINE_TIMEOUT,
    UNASSIGNED_TENANT,
)
from backend.database import models, nvr_models
from backend.database.organization_models import Organization
from backend.database.orm import orm_camera, orm_location, orm_organization
from backend.database.orm.orm_utils import TenantProtectedTable
from backend.database.session import TenantAwareAsyncSession
from backend.models import AccessRestrictions, NVRResponse
from backend.utils import AwareDatetime

logger = logging.getLogger(logging_config.LOGGER_NAME)


class NVR(TenantProtectedTable):
    __tablename__ = "nvrs"
    id: orm.Mapped[int] = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    # The identifier that we use to register device
    uuid = sa.Column(sa.String, nullable=False, unique=True)
    # Optional pointer to the location. If missing, it means that it's not yet
    # activated
    location_id = sa.Column(sa.Integer, sa.ForeignKey("locations.id"), nullable=True)
    # The last time we received a camera discovery message from the NVR
    last_seen_time = sa.Column(sa.TIMESTAMP(timezone=True), nullable=True)
    # The timezone of the NVR
    # Note: This timezone not used for the internal time of the nvr, but to show
    # timeline and times in the frontend in that timezone
    timezone = sa.Column(sa.String, nullable=True)
    # Days to keep history video logs on edge.
    retention_days = sa.Column(sa.Integer, default=60)
    # max cameras slots this nvr can support
    max_cameras_slots = sa.Column(
        sa.Integer, nullable=False, default=DEFAULT_MAX_NUM_CAMERA_SLOTS_NVR
    )
    # If true, the NVR max_num_camera_slots can be changed by the NVR
    max_cameras_slots_locked = sa.Column(sa.Boolean, nullable=False, default=False)
    nvr_info = sa.Column(sa.JSON, nullable=True)

    __table_args__ = ((sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),)

    @staticmethod
    async def system_new_nvr(
        session: AsyncSession, nvr_metadata: models.NVRCreate
    ) -> NVR:
        """Add new unassigned NVR to the DB."""
        # NOTE(@lberg): We should set location ID to None, but it fails all tests
        # because there we assume we add NVRs with a location.
        nvr = NVR(
            uuid=nvr_metadata.uuid,
            last_seen_time=nvr_metadata.last_seen_time,
            location_id=nvr_metadata.location_id,
        )
        session.add(nvr)
        return nvr

    @staticmethod
    async def system_unassign_nvr(session: AsyncSession, nvr_uuid: str) -> None:
        query = sa.select(NVR).where(NVR.uuid == nvr_uuid)
        result = (await session.execute(query)).one()
        nvr = result.NVR
        nvr.location_id = None
        nvr.tenant = UNASSIGNED_TENANT

    @staticmethod
    async def system_get_nvrs(
        session: AsyncSession,
        query_config: models.NvrsQueryConfig,
        access: AccessRestrictions | None = None,
    ) -> list[NVRResponse]:
        """Get the list of NVRs optionally given an organization and given a
        location. Admin-only version of get_nvrs.
        """
        where_clauses = []
        if query_config.location_id is not None:
            where_clauses.append(orm_location.Location.id == query_config.location_id)
        if access is not None and not access.full_access:
            where_clauses.append(
                orm_location.Location.id.in_(
                    access.location_ids
                    + [group.location_id for group in access.camera_groups]
                )
            )
        if query_config.uuids is not None:
            where_clauses.append(NVR.uuid.in_(query_config.uuids))

        query = (
            sa.select(
                NVR.id,
                NVR.uuid,
                NVR.location_id,
                NVR.last_seen_time,
                NVR.retention_days,
                NVR.max_cameras_slots,
                NVR.tenant,
                NVR.timezone.label("nvr_timezone"),
                NVR.nvr_info,
                orm_location.Location.name.label("location_name"),
                orm_location.Location.enable_setting_timezone.label(
                    "location_enable_setting_timezone"
                ),
                orm_location.Location.timezone.label("location_timezone"),
                orm_location.Location.address,
                orm_location.Location.address_lat,
                orm_location.Location.address_lon,
                orm_organization.Organization.name.label("organization_name"),
                func.count(orm_camera.Camera.id)
                .filter(orm_camera.Camera.is_enabled.is_(True))
                .label("num_cameras_enabled"),
                func.count(orm_camera.Camera.id)
                .filter(orm_camera.Camera.is_enabled.is_(False))
                .label("num_cameras_disabled"),
            )
            .join(
                orm_location.Location,
                NVR.location_id == orm_location.Location.id,
                isouter=(
                    query_config.include_without_location if query_config else False
                ),
            )
            .join(
                orm_organization.Organization,
                NVR.tenant == orm_organization.Organization.tenant,
            )
            .join(
                orm_camera.Camera, NVR.uuid == orm_camera.Camera.nvr_uuid, isouter=True
            )
            .where(*where_clauses)
            .group_by(
                NVR.id,
                NVR.uuid,
                NVR.location_id,
                NVR.last_seen_time,
                orm_location.Location.name,
                orm_location.Location.enable_setting_timezone,
                orm_location.Location.timezone,
                orm_location.Location.address,
                orm_location.Location.address_lat,
                orm_location.Location.address_lon,
                orm_organization.Organization.name,
                orm_organization.Organization.tenant,
            )
        )
        result = await session.execute(query)
        rows = result.all()
        response: list[NVRResponse] = []
        for row in rows:
            is_online = False
            if row.last_seen_time is not None:
                is_online = (
                    AwareDatetime.utcnow() - row.last_seen_time
                ) < NVR_ONLINE_TIMEOUT

            timezone = (
                row.location_timezone
                if row.location_enable_setting_timezone is True
                else row.nvr_timezone
            )
            response.append(
                NVRResponse(
                    id=row.id,
                    uuid=row.uuid,
                    location_id=row.location_id,
                    last_seen_time=row.last_seen_time,
                    is_online=is_online,
                    location_name=row.location_name,
                    timezone=timezone,
                    address=row.address,
                    address_lat=row.address_lat,
                    address_lon=row.address_lon,
                    num_cameras_enabled=row.num_cameras_enabled,
                    num_cameras_disabled=row.num_cameras_disabled,
                    org_name=row.organization_name,
                    org_tenant=row.tenant,
                    retention_days=row.retention_days,
                    internet_status=None,
                    num_available_cameras_slots=row.max_cameras_slots
                    - row.num_cameras_enabled,
                    max_cameras_slots=row.max_cameras_slots,
                    nvr_info=NVR._parse_nvr_info_or_none(row.nvr_info),
                )
            )
        return response

    @staticmethod
    async def get_nvrs(
        session: TenantAwareAsyncSession,
        access: AccessRestrictions,
        location_id: int | None = None,
    ) -> list[NVRResponse]:
        return await NVR.system_get_nvrs(
            session=session,
            query_config=models.NvrsQueryConfig(location_id=location_id),
            access=access,
        )

    @staticmethod
    async def system_get_nvr_by_uuid(
        session: AsyncSession, uuid: str, access: AccessRestrictions | None = None
    ) -> models.NVR | None:
        where_clauses = [NVR.uuid == uuid]
        if access is not None and not access.full_access:
            where_clauses.append(
                NVR.location_id.in_(
                    access.location_ids
                    + [group.location_id for group in access.camera_groups]
                )
            )
        query = sa.select(NVR).where(*where_clauses)
        result = await session.execute(query)
        row = result.first()
        return models.NVR.from_orm(row.NVR) if row is not None else None

    @staticmethod
    async def get_nvr_by_uuid(
        session: TenantAwareAsyncSession, uuid: str, access: AccessRestrictions
    ) -> models.NVR | None:
        return await NVR.system_get_nvr_by_uuid(session, uuid, access)

    @staticmethod
    async def get_nvr_response_by_uuid(
        session: TenantAwareAsyncSession, uuid: str, access: AccessRestrictions
    ) -> NVRResponse | None:
        """Get an NVR from the given uuid."""
        nvrs = await NVR.system_get_nvrs(
            session=session,
            query_config=models.NvrsQueryConfig(uuids={uuid}),
            access=access,
        )
        if len(nvrs) == 0:
            return None

        return nvrs[0]

    @staticmethod
    async def get_nvrs_response_by_uuid(
        session: TenantAwareAsyncSession, uuids: list[str], access: AccessRestrictions
    ) -> list[NVRResponse]:
        """Get an NVR from the given uuid."""
        nvrs = await NVR.system_get_nvrs(
            session=session,
            query_config=models.NvrsQueryConfig(uuids=set(uuids)),
            access=access,
        )
        # reorder the response to match the order of the input uuids
        nvrs_dict = {nvr.uuid: nvr for nvr in nvrs}
        return [nvrs_dict[uuid] for uuid in uuids if uuid in nvrs_dict]

    @staticmethod
    async def get_nvrs_by_uuid(
        session: TenantAwareAsyncSession, access: AccessRestrictions, uuids: set[str]
    ) -> list[models.NVR]:
        query = (
            sa.select(NVR)
            .join(orm_location.Location, NVR.location_id == orm_location.Location.id)
            .join(
                orm_organization.Organization,
                orm_location.Location.tenant == orm_organization.Organization.tenant,
            )
            .where(NVR.uuid.in_(uuids), orm_location.generate_access_statement(access))
        )
        result = await session.execute(query)
        rows = result.all()
        return [models.NVR.from_orm(row.NVR) for row in rows]

    @staticmethod
    async def system_validate_nvr_code(session: AsyncSession, code: str) -> bool:
        """Method to check if a uuid code provided by a user matches exactly one
        unregistered NVR in the DB. Unregistered mean without a location
        connection.
        """
        query = sa.select(NVR).where(NVR.uuid == code, NVR.location_id.is_(None))
        result = await session.execute(query)
        row = result.first()
        return row is not None

    @staticmethod
    async def system_register_nvr(
        session: AsyncSession, code: str, location_id: int, tenant: str
    ) -> bool:
        """Register a new NVR device. Done by the user by providing code
        and location mapping."""
        query = (
            sa.update(NVR)
            .where(NVR.uuid == code)
            .values(location_id=location_id, tenant=tenant)
        )
        result = await session.execute(query)
        return result.rowcount == 1  # type: ignore[attr-defined,no-any-return]

    @staticmethod
    async def system_update_nvr_last_seen(
        session: AsyncSession, nvr_uuid: str, last_seen_time: AwareDatetime
    ) -> bool:
        query = (
            sa.update(NVR)
            .where(NVR.uuid == nvr_uuid)
            .values(last_seen_time=last_seen_time)
        )
        result = await session.execute(query)
        return bool(result.rowcount == 1)  # type: ignore[attr-defined]

    @staticmethod
    async def system_update_nvr_last_seen_and_info(
        session: AsyncSession,
        nvr_uuid: str,
        last_seen_time: AwareDatetime,
        nvr_info: nvr_models.NvrInfo,
    ) -> None:
        stmt = (
            sa.update(NVR)
            .where(NVR.uuid == nvr_uuid)
            .values(last_seen_time=last_seen_time)
            .values(nvr_info=nvr_info.dict())
        )
        row_count = (await session.execute(stmt)).rowcount  # type: ignore[attr-defined]

        if row_count != 1:
            raise nvr_models.NVRUpdateError(
                f"Expected to update 1 NVR, but updated {row_count} NVRs"
            )

    @staticmethod
    async def update_nvr_timezone(
        session: TenantAwareAsyncSession, nvr_uuid: str, timezone: str
    ) -> bool:
        query = sa.update(NVR).where(NVR.uuid == nvr_uuid).values(timezone=timezone)
        result = await session.execute(query)
        return bool(result.rowcount == 1)  # type: ignore[attr-defined]

    @staticmethod
    async def system_update_nvr_retention(
        session: AsyncSession, nvr_uuid: str, retention_days: int
    ) -> bool:
        query = (
            sa.update(NVR)
            .where(NVR.uuid == nvr_uuid)
            .values(retention_days=retention_days)
        )
        result = await session.execute(query)
        return bool(result.rowcount == 1)  # type: ignore[attr-defined]

    @staticmethod
    async def update_nvr_max_cameras_slots(
        session: TenantAwareAsyncSession, nvr_uuid: str, max_cameras_slots: int
    ) -> bool:
        if await NVR.system_is_locked_max_cameras_slots(session, nvr_uuid):
            return False
        query = (
            sa.update(NVR)
            .where(NVR.uuid == nvr_uuid)
            .values(max_cameras_slots=max_cameras_slots)
        )
        result = await session.execute(query)
        return bool(result.rowcount == 1)  # type: ignore[attr-defined]

    @staticmethod
    async def system_set_lock_max_cameras_slots(
        session: AsyncSession, action: models.NVRSlotsAction
    ) -> bool:
        if isinstance(action, models.NVRSlotsLock):
            query = (
                sa.update(NVR)
                .where(NVR.uuid == action.nvr_uuid)
                .values(
                    max_cameras_slots_locked=True, max_cameras_slots=action.num_slots
                )
            )
        else:
            query = (
                sa.update(NVR)
                .where(NVR.uuid == action.nvr_uuid)
                .values(max_cameras_slots_locked=False)
            )
        result = await session.execute(query)
        return bool(result.rowcount == 1)  # type: ignore[attr-defined]

    @staticmethod
    async def system_is_locked_max_cameras_slots(
        session: AsyncSession, nvr_uuid: str
    ) -> bool:
        exists_stmt = sa.select(
            sa.exists().where(
                sa.and_(NVR.uuid == nvr_uuid, NVR.max_cameras_slots_locked.is_(True))
            )
        )
        result = await session.execute(exists_stmt)
        return bool(result.scalar())

    @staticmethod
    async def system_get_owner(
        session: AsyncSession, nvr_uuid: str
    ) -> Organization | None:
        query = (
            sa.select(orm_organization.Organization)
            .join(NVR, orm_organization.Organization.tenant == NVR.tenant)
            .where(NVR.uuid == nvr_uuid, NVR.tenant != UNASSIGNED_TENANT)
        )
        result = await session.execute(query)
        row = result.first()
        return Organization.from_orm(row.Organization) if row is not None else None

    @staticmethod
    async def get_allowed_mac_addresses(
        session: TenantAwareAsyncSession, nvr_uuid: str, received_mac_address: list[str]
    ) -> set[str]:
        cameras = await orm_camera.Camera.get_cameras(
            session, query_config=models.CamerasQueryConfig(nvr_uuids={nvr_uuid})
        )
        nvr_mac_addresses = set(res.camera.mac_address for res in cameras)
        return nvr_mac_addresses.intersection(received_mac_address)

    @staticmethod
    async def update_nvr_location(
        session: TenantAwareAsyncSession, nvr_uuid: str, location_id: int
    ) -> bool:
        query = (
            sa.update(NVR).where(NVR.uuid == nvr_uuid).values(location_id=location_id)
        )
        result = await session.execute(query)
        return bool(result.rowcount == 1)  # type: ignore[attr-defined]

    @staticmethod
    def _parse_nvr_info_or_none(data: Any) -> nvr_models.NvrInfo | None:
        if not data:
            return None

        try:
            return nvr_models.NvrInfo.parse_obj(data)
        except ValidationError:
            logger.error(f"Error parsing NvrInfo {data=}")
            return None
