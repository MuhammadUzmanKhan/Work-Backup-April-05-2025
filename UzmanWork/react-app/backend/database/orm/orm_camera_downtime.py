from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy import orm

from backend.database import camera_downtime_models as models
from backend.database.orm import orm_utils
from backend.database.session import TenantAwareAsyncSession
from backend.utils import AwareDatetime


class CameraDowntime(orm_utils.TenantProtectedTable):
    __tablename__ = "camera_downtimes"

    id: orm.Mapped[int] = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    camera_mac_address = sa.Column(
        sa.String, sa.ForeignKey("cameras.mac_address"), nullable=False
    )
    downtime_start = sa.Column(sa.TIMESTAMP(timezone=True), nullable=False)
    downtime_end = sa.Column(sa.TIMESTAMP(timezone=True), nullable=False)

    __table_args__ = ((sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),)

    @staticmethod
    async def get_most_recent_downtimes_by_mac(
        session: TenantAwareAsyncSession, camera_mac_addresses: set[str]
    ) -> dict[str, models.CameraDowntime]:
        query = (
            sa.select(CameraDowntime)
            .where(CameraDowntime.camera_mac_address.in_(camera_mac_addresses))
            .order_by(
                CameraDowntime.camera_mac_address, CameraDowntime.downtime_start.desc()
            )
            .distinct(CameraDowntime.camera_mac_address)
        )

        most_recent_downtimes = (await session.execute(query)).scalars().all()
        return {
            downtime.camera_mac_address: models.CameraDowntime.from_orm(downtime)
            for downtime in most_recent_downtimes
        }

    @staticmethod
    async def add_camera_downtimes(
        session: TenantAwareAsyncSession, inserts: list[models.AddCameraDowntime]
    ) -> None:
        await orm_utils.bulk_insert(
            session,
            CameraDowntime,
            [
                dict(
                    camera_mac_address=insert.camera_mac_address,
                    downtime_start=insert.downtime_start,
                    downtime_end=insert.downtime_end,
                    tenant=session.tenant,
                )
                for insert in inserts
            ],
        )

    @staticmethod
    async def update_camera_downtimes(
        session: TenantAwareAsyncSession,
        updates: list[models.UpdateCameraDowntimeWithId],
    ) -> None:
        update_mappings = [
            dict(id=update.downtime_id, downtime_end=update.downtime_end)
            for update in updates
        ]

        await session.run_sync(
            lambda s: s.bulk_update_mappings(CameraDowntime, update_mappings)
        )

    @staticmethod
    async def get_downtimes_for_camera(
        session: TenantAwareAsyncSession,
        camera_mac_address: str,
        time_start: AwareDatetime,
        time_end: AwareDatetime,
    ) -> list[models.CameraDowntime]:
        query = (
            sa.select(CameraDowntime)
            .where(
                CameraDowntime.camera_mac_address == camera_mac_address,
                (
                    CameraDowntime.downtime_start >= time_start
                    if time_start
                    else sa.true()
                ),
                CameraDowntime.downtime_start <= time_end if time_end else sa.true(),
            )
            .order_by(CameraDowntime.downtime_start)
        )

        result = await session.execute(query)
        downtimes = result.scalars().all()
        return [models.CameraDowntime.from_orm(downtime) for downtime in downtimes]
