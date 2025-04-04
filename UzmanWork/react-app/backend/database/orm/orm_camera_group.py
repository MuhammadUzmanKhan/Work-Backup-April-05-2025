from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy import orm
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import models
from backend.database.orm import orm_camera, orm_location, orm_nvr
from backend.database.orm.orm_utils import TenantProtectedTable
from backend.database.session import TenantAwareAsyncSession
from backend.models import AccessRestrictions, CameraGroupWithLocations

DEFAULT_GROUP_NAME = "Default Group"


class CameraGroup(TenantProtectedTable):
    __tablename__ = "camera_groups"
    id: orm.Mapped[int] = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    # Name of the group, e.g. "Gate 1 Ingress"
    name = sa.Column(sa.String, nullable=False)
    # whether this group is the default group for the tenant
    # (the one unassigned cameras are assigned to)
    is_default = sa.Column(sa.Boolean, default=False, nullable=False)

    __table_args__ = (
        sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"]),
        # There can be only one default group per tenant.
        sa.Index(
            "ix_camera_groups_only_one_default",
            is_default,
            "tenant",
            unique=True,
            postgresql_where=is_default,
        ),
    )

    @staticmethod
    async def new_group(
        session: TenantAwareAsyncSession, group_metadata: models.CameraGroupCreate
    ) -> CameraGroup:
        group = CameraGroup(
            name=group_metadata.name,
            tenant=session.tenant,
            is_default=group_metadata.is_default,
        )
        session.add(group)
        return group

    @staticmethod
    async def get_allowed_groups(
        session: TenantAwareAsyncSession, access: AccessRestrictions
    ) -> list[models.CameraGroup]:
        where_clauses = []
        if not access.full_access and not access.location_ids:
            where_clauses.append(
                CameraGroup.id.in_(
                    [group.camera_group_id for group in access.camera_groups]
                )
            )
        stmt = sa.select(CameraGroup).where(*where_clauses)
        result = await session.execute(stmt)
        groups = result.scalars().all()
        return [models.CameraGroup.from_orm(group) for group in groups]

    @staticmethod
    async def remove_unused_groups(session: TenantAwareAsyncSession) -> int:
        query = (
            sa.delete(CameraGroup)
            .where(
                CameraGroup.id.notin_(
                    sa.select(orm_camera.Camera.camera_group_id).where(
                        orm_camera.Camera.camera_group_id != None  # noqa: E711
                    )
                ),
                CameraGroup.is_default == False,
            )
            .execution_options(synchronize_session="fetch")
        )
        return (await session.execute(query)).rowcount  # type: ignore

    @staticmethod
    async def get_groups_with_location(
        session: TenantAwareAsyncSession, access_restrictions: AccessRestrictions
    ) -> list[CameraGroupWithLocations]:
        """Get the metadata for a given list of group ids extended with location
        information, i.e.  the set of all location ids where the group has at
        least one stream.

        :param group_ids: Input group ids for which we want the locations.
        :return: List of objects with CameraGroup metadata and locations.
        """
        stmt = (
            sa.select(
                [
                    orm_camera.Camera.camera_group_id,
                    orm_camera.Camera.nvr_uuid,
                    CameraGroup.name,
                    CameraGroup.is_default,
                    CameraGroup.tenant,
                    orm_location.Location.id.label("location_id"),
                ]
            )
            .join(orm_nvr.NVR, orm_camera.Camera.nvr_uuid == orm_nvr.NVR.uuid)
            .join(
                orm_location.Location,
                orm_nvr.NVR.location_id == orm_location.Location.id,
            )
            .join(CameraGroup, orm_camera.Camera.camera_group_id == CameraGroup.id)
            .where(orm_camera.generate_access_statement(access_restrictions))
        )
        result = await session.execute(stmt)
        rows = result.all()
        response: dict[int, CameraGroupWithLocations] = {}
        for row in rows:
            if row.camera_group_id in response.keys():
                response[row.camera_group_id].location_ids.add(row.location_id)
            else:
                response[row.camera_group_id] = CameraGroupWithLocations(
                    id=row.camera_group_id,
                    name=row.name,
                    tenant=row.tenant,
                    is_default=row.is_default,
                    location_ids={row.location_id},
                )

        return list(response.values())

    @staticmethod
    async def system_get_tenant_default_group(
        session: AsyncSession, tenant: str
    ) -> models.CameraGroup:
        stmt = sa.select(CameraGroup).where(
            CameraGroup.is_default, CameraGroup.tenant == tenant
        )
        result = (await session.execute(stmt)).scalar_one_or_none()
        if result is not None:
            return models.CameraGroup.from_orm(result)

        # create a default group for the tenant
        group = CameraGroup(name=DEFAULT_GROUP_NAME, tenant=tenant, is_default=True)
        session.add(group)
        await session.flush()
        return models.CameraGroup.from_orm(group)

    @staticmethod
    async def get_tenant_default_group(
        session: TenantAwareAsyncSession,
    ) -> models.CameraGroup:
        return await CameraGroup.system_get_tenant_default_group(
            session, session.tenant
        )
