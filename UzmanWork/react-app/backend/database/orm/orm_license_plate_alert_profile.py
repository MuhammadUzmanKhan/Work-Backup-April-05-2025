from __future__ import annotations

from typing import List

import sqlalchemy as sa
from sqlalchemy import orm

from backend.database import models
from backend.database.orm import orm_notification_group
from backend.database.orm.orm_utils import Base, TenantProtectedTable
from backend.database.session import TenantAwareAsyncSession
from backend.s3_utils import S3Path

association_table = sa.Table(
    "notification_groups_to_license_plate_alert_profiles",
    Base.metadata,
    sa.Column(
        "profile_id",
        sa.ForeignKey("license_plate_alert_profiles.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    sa.Column(
        "notification_group_id",
        sa.ForeignKey("notification_groups.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class LicensePlateAlertProfileError(Exception):
    """Base class for LicensePlateAlertProfile exceptions."""

    pass


class LicensePlateAlertProfileAlreadyExistsError(LicensePlateAlertProfileError):
    """Raised when a license plate alert profile already exists."""

    pass


class LicensePlateAlertProfileNotFoundError(LicensePlateAlertProfileError):
    """Raised when a license plate alert profile already exists."""

    pass


class LicensePlateAlertProfile(TenantProtectedTable):
    __tablename__ = "license_plate_alert_profiles"
    # The license plate alert profiles ID
    id: orm.Mapped[int] = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    # Detected license plate number
    license_plate_number = sa.Column(
        sa.String, sa.ForeignKey("license_plates.license_plate_number"), nullable=False
    )
    # The email address of the owner of the alert profile
    owner_user_email = sa.Column(sa.String, nullable=False)
    # The creation time of this alert profile
    creation_time = sa.Column(sa.TIMESTAMP(timezone=True), nullable=False)
    # The notification groups associated with this alert profile
    notification_groups: orm.Mapped[List[orm_notification_group.NotificationGroup]] = (
        orm.relationship(
            orm_notification_group.NotificationGroup, secondary=association_table
        )
    )
    # Path to the reference image of the license plate
    # when the alert profile was created
    image_s3_path = sa.Column(sa.String, nullable=False)
    # Coordinates of the detected license plate in image coordinates
    x_min = sa.Column(sa.Float, nullable=False)
    y_min = sa.Column(sa.Float, nullable=False)
    x_max = sa.Column(sa.Float, nullable=False)
    y_max = sa.Column(sa.Float, nullable=False)

    # No one can create a license plate alert profile with the same license plate number
    # in the same org.
    __table_args__ = (
        sa.UniqueConstraint(license_plate_number, "tenant"),
        (sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),
    )

    @staticmethod
    async def add_profile(
        session: TenantAwareAsyncSession,
        alert_profile_create: models.LicensePlateAlertProfileCreate,
    ) -> int:
        alert_profile = LicensePlateAlertProfile(
            license_plate_number=alert_profile_create.license_plate_number,
            owner_user_email=alert_profile_create.owner_user_email,
            creation_time=alert_profile_create.creation_time,
            tenant=session.tenant,
            image_s3_path=alert_profile_create.image_s3_path,
            x_min=alert_profile_create.x_min,
            y_min=alert_profile_create.y_min,
            x_max=alert_profile_create.x_max,
            y_max=alert_profile_create.y_max,
        )
        session.add(alert_profile)
        try:
            await session.flush()
        except sa.exc.IntegrityError as ex:
            if "violates unique constraint" in str(ex):
                raise LicensePlateAlertProfileAlreadyExistsError(
                    "License plate alert profile with license plate "
                    f"{alert_profile_create.license_plate_number} already exists."
                )
            else:
                raise
        return alert_profile.id

    @staticmethod
    def _get_profiles_select_clause() -> sa.sql.Select:
        query = (
            sa.select(LicensePlateAlertProfile)
            .options(sa.orm.selectinload(LicensePlateAlertProfile.notification_groups))
            .options(sa.orm.selectinload("notification_groups.members"))
        )
        return query

    @staticmethod
    async def get_profiles(
        session: TenantAwareAsyncSession,
        profile_ids: set[int] | None = None,
        license_plate_numbers: set[str] | None = None,
    ) -> list[models.LicensePlateAlertProfile]:
        where_clauses = []
        if profile_ids is not None:
            where_clauses.append(LicensePlateAlertProfile.id.in_(profile_ids))
        if license_plate_numbers is not None:
            where_clauses.append(
                LicensePlateAlertProfile.license_plate_number.in_(license_plate_numbers)
            )
        query = (
            LicensePlateAlertProfile._get_profiles_select_clause()
            .where(*where_clauses)
            .order_by(LicensePlateAlertProfile.creation_time.desc())
        )
        result = (await session.execute(query)).scalars().all()
        return [models.LicensePlateAlertProfile.from_orm(row) for row in result]

    @staticmethod
    async def update_notification_groups(
        session: TenantAwareAsyncSession,
        alert_profile_id: int,
        notification_group_ids: set[int],
    ) -> None:
        query = (
            sa.select(LicensePlateAlertProfile)
            .options(sa.orm.selectinload(LicensePlateAlertProfile.notification_groups))
            .where(LicensePlateAlertProfile.id == alert_profile_id)
        )
        result = (await session.execute(query)).one_or_none()

        if result is None:
            raise LicensePlateAlertProfileNotFoundError(
                f"Alert profile with id {alert_profile_id} not found within"
                " organization"
            )

        # Get notification groups from database
        try:
            notification_groups = (
                await orm_notification_group.NotificationGroup.get_groups(
                    session, notification_group_ids
                )
            )
        except orm_notification_group.NotificationGroupNotFoundError as e:
            raise LicensePlateAlertProfileError(
                f"Error updating notification groups for alert profile with id: {e}"
            )

        result.LicensePlateAlertProfile.notification_groups = notification_groups

    @staticmethod
    async def get_profile_s3_path(
        session: TenantAwareAsyncSession, profile_id: int
    ) -> S3Path:
        query = sa.select(LicensePlateAlertProfile.image_s3_path).where(
            LicensePlateAlertProfile.id == profile_id
        )
        result = (await session.execute(query)).one_or_none()
        if result is None:
            raise LicensePlateAlertProfileNotFoundError(
                f"Alert profile with id {profile_id} not found within organization"
            )
        return S3Path(result[0])

    @staticmethod
    async def delete_profile(
        session: TenantAwareAsyncSession, alert_profile_id: int
    ) -> None:
        row_count = (
            await session.execute(
                sa.delete(LicensePlateAlertProfile).where(
                    LicensePlateAlertProfile.id == alert_profile_id
                )
            )
        ).rowcount  # type: ignore

        if row_count != 1:
            raise LicensePlateAlertProfileNotFoundError(
                f"Alert profile with id {alert_profile_id} not found within"
                " organization"
            )
