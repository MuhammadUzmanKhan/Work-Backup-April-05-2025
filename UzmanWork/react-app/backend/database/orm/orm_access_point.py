from __future__ import annotations

from typing import List

import sqlalchemy as sa
from sqlalchemy import orm
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import access_points_models as ap_models
from backend.database.orm.orm_utils import TenantProtectedTable
from backend.database.session import TenantAwareAsyncSession


class AccessPointCamera(TenantProtectedTable):
    __tablename__ = "access_points_cameras"

    # access point ID
    access_point_id = sa.Column(sa.String, nullable=False)

    # access point vendor
    access_point_vendor = sa.Column(
        sa.Enum(ap_models.AccessPointVendor), nullable=False
    )

    # camera mac address
    camera_mac_address = sa.Column(
        sa.String, sa.ForeignKey("cameras.mac_address", ondelete="CASCADE")
    )

    # is favorite
    is_favorite = sa.Column(
        sa.Boolean(), nullable=False, default=False, server_default="false"
    )

    __table_args__ = (
        sa.ForeignKeyConstraint(
            ["access_point_id", "access_point_vendor", "tenant"],
            ["access_points.id", "access_points.vendor", "access_points.tenant"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint(
            "access_point_id", "access_point_vendor", "tenant", "camera_mac_address"
        ),
    )


# Access points metadata
class AccessPoint(TenantProtectedTable):
    # Association table between access points and cameras
    __tablename__ = "access_points"

    # access point ID
    id = sa.Column(sa.String, nullable=False)

    # access point vendor
    vendor = sa.Column(sa.Enum(ap_models.AccessPointVendor), nullable=False)

    # Optional reference to a location. Absence indicates the AccessPoint is unset,
    # and cameras should not be associated.
    location_id = sa.Column(
        sa.Integer, sa.ForeignKey("locations.id", ondelete="SET NULL"), nullable=True
    )

    __table_args__ = (
        (sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),
        sa.PrimaryKeyConstraint("id", "vendor", "tenant"),
    )

    # cameras associated with the access point
    cameras: orm.Mapped[List[AccessPointCamera]] = orm.relationship(
        "AccessPointCamera", cascade="all, delete-orphan", single_parent=True
    )

    @staticmethod
    async def create_access_point(
        session: TenantAwareAsyncSession, ap_identifier: ap_models.AccessPointIdentifier
    ) -> AccessPoint:
        access_point = AccessPoint(
            id=ap_identifier.id,
            vendor=ap_identifier.vendor,
            tenant=session.tenant,
            cameras=[],
        )
        session.add(access_point)
        return access_point

    @staticmethod
    async def get_access_points(session: TenantAwareAsyncSession) -> list[AccessPoint]:
        query = sa.select(AccessPoint).options(orm.selectinload(AccessPoint.cameras))
        result = await session.execute(query)
        return [row.AccessPoint for row in result]

    @staticmethod
    async def set_location(
        session: TenantAwareAsyncSession,
        ap_identifier: ap_models.AccessPointIdentifier,
        location_id: int | None,
    ) -> None:
        result = await session.execute(
            sa.select(AccessPoint)
            .options(orm.selectinload(AccessPoint.cameras))
            .where(
                AccessPoint.id == ap_identifier.id,
                AccessPoint.vendor == ap_identifier.vendor,
            )
        )
        access_point = result.scalars().first()

        if not access_point:
            raise ap_models.AccessPointNotFoundError(
                "You cannot set location for a non-existent access point."
            )

        access_point.location_id = location_id
        access_point.cameras = []

    @staticmethod
    async def assign_camera(
        session: TenantAwareAsyncSession,
        ap_identifier: ap_models.AccessPointIdentifier,
        camera_mac_address: str,
        mark_as_favorite: bool,
    ) -> None:
        await AccessPoint._check_access_point_exists_or_raise(session, ap_identifier)

        await session.execute(
            sa.dialects.postgresql.insert(AccessPointCamera)
            .values(
                access_point_id=ap_identifier.id,
                access_point_vendor=ap_identifier.vendor,
                tenant=session.tenant,
                camera_mac_address=camera_mac_address,
                is_favorite=mark_as_favorite,
            )
            .on_conflict_do_nothing(
                index_elements=[
                    "access_point_id",
                    "access_point_vendor",
                    "tenant",
                    "camera_mac_address",
                ]
            )
        )

    @staticmethod
    async def unassign_camera(
        session: TenantAwareAsyncSession,
        ap_identifier: ap_models.AccessPointIdentifier,
        camera_mac_address: str,
    ) -> None:
        await AccessPoint._check_access_point_exists_or_raise(session, ap_identifier)

        access_point_camera = (
            await session.execute(
                sa.select(AccessPointCamera).where(
                    AccessPointCamera.access_point_id == ap_identifier.id,
                    AccessPointCamera.access_point_vendor == ap_identifier.vendor,
                    AccessPointCamera.camera_mac_address == camera_mac_address,
                )
            )
        ).scalar_one_or_none()
        if access_point_camera is None:
            raise ap_models.AccessPointCameraNotFoundError(
                "Camera is not associated with access point."
            )

        # Check if the target camera is marked as favorite
        if access_point_camera.is_favorite:
            # Find another camera to mark as favorite
            another_access_point_camera = (
                await session.execute(
                    sa.select(AccessPointCamera)
                    .where(
                        AccessPointCamera.access_point_id == ap_identifier.id,
                        AccessPointCamera.access_point_vendor == ap_identifier.vendor,
                        AccessPointCamera.camera_mac_address != camera_mac_address,
                    )
                    .limit(1)
                )
            ).scalar_one_or_none()

            # Mark the found camera as favorite, if any
            if another_access_point_camera:
                another_access_point_camera.is_favorite = True

        await session.delete(access_point_camera)

    @staticmethod
    async def set_favorite_camera(
        session: TenantAwareAsyncSession,
        ap_identifier: ap_models.AccessPointIdentifier,
        camera_mac_address: str,
    ) -> None:
        await AccessPoint._check_access_point_exists_or_raise(session, ap_identifier)

        await session.execute(
            sa.update(AccessPointCamera)
            .where(
                sa.and_(
                    AccessPointCamera.access_point_id == ap_identifier.id,
                    AccessPointCamera.access_point_vendor == ap_identifier.vendor,
                )
            )
            .values(is_favorite=False)
        )

        await session.execute(
            sa.update(AccessPointCamera)
            .where(
                sa.and_(
                    AccessPointCamera.access_point_id == ap_identifier.id,
                    AccessPointCamera.access_point_vendor == ap_identifier.vendor,
                    AccessPointCamera.camera_mac_address == camera_mac_address,
                )
            )
            .values(is_favorite=True)
        )

    @staticmethod
    async def delete_access_points(
        session: TenantAwareAsyncSession,
        ap_identifiers: list[ap_models.AccessPointIdentifier],
    ) -> None:
        if not ap_identifiers:
            return

        delete_conditions = [
            sa.and_(
                AccessPoint.id == ap_identifier.id,
                AccessPoint.vendor == ap_identifier.vendor,
            )
            for ap_identifier in ap_identifiers
        ]

        await session.execute(sa.delete(AccessPoint).where(sa.or_(*delete_conditions)))

    @staticmethod
    async def get_access_point(
        session: TenantAwareAsyncSession, ap_identifier: ap_models.AccessPointIdentifier
    ) -> ap_models.AccessPoint:
        stmt = (
            sa.select(AccessPoint)
            .options(orm.selectinload(AccessPoint.cameras))
            .where(
                sa.and_(
                    AccessPoint.id == ap_identifier.id,
                    AccessPoint.vendor == ap_identifier.vendor,
                )
            )
        )

        result = (await session.execute(stmt)).scalar()
        if result is None:
            raise ap_models.AccessPointNotFoundError("Access point does not exist.")

        return ap_models.AccessPoint.from_orm(result)

    @staticmethod
    async def _check_access_point_exists_or_raise(
        session: TenantAwareAsyncSession, ap_identifier: ap_models.AccessPointIdentifier
    ) -> None:
        exists_stmt = sa.select(
            sa.exists().where(
                sa.and_(
                    AccessPoint.id == ap_identifier.id,
                    AccessPoint.vendor == ap_identifier.vendor,
                )
            )
        )
        result = await session.execute(exists_stmt)
        exists = bool(result.scalar())

        if not exists:
            raise ap_models.AccessPointNotFoundError("Access point does not exist.")

    @staticmethod
    async def system_delete_all_relations_with_camera(
        session: AsyncSession, camera_mac_address: str
    ) -> None:
        """Delete the camera from all associated access points."""

        await session.execute(
            sa.delete(AccessPointCamera).where(
                AccessPointCamera.camera_mac_address == camera_mac_address
            )
        )

    @staticmethod
    async def delete_access_points_by_vendor(
        session: TenantAwareAsyncSession, vendor: ap_models.AccessPointVendor
    ) -> None:
        await session.execute(
            sa.delete(AccessPoint).where(AccessPoint.vendor == vendor)
        )
