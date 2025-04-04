from __future__ import annotations

from typing import List

import sqlalchemy as sa
from sqlalchemy import exc, orm

from backend.database import face_models, models
from backend.database.orm import orm_face, orm_notification_group
from backend.database.orm.orm_utils import Base, TenantProtectedTable
from backend.database.session import TenantAwareAsyncSession


class FaceAlertProfileError(Exception):
    pass


class FaceAlertProfileNotFoundError(FaceAlertProfileError):
    pass


class DuplicateFaceAlertProfileError(FaceAlertProfileError):
    pass


association_table = sa.Table(
    "notification_groups_to_alert_profiles",
    Base.metadata,
    sa.Column(
        "profile_id",
        sa.ForeignKey("face_alert_profiles.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    sa.Column(
        "notification_group_id",
        sa.ForeignKey("notification_groups.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class FaceAlertProfile(TenantProtectedTable):
    __tablename__ = "face_alert_profiles"
    # The face alert profiles ID
    id: orm.Mapped[int] = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    # Optional description of the alert
    description = sa.Column(sa.String, nullable=True)
    # Whether the profile is added to person of interest list
    is_person_of_interest = sa.Column(sa.Boolean, nullable=False)
    # The email address of the owner of the alert profile
    owner_user_email = sa.Column(sa.String, nullable=False)
    # The creation time of this alert profile
    creation_time = sa.Column(sa.TIMESTAMP(timezone=True), nullable=False)
    # Profile are associated with an org-wise unique face
    org_unique_face_id = sa.Column(
        sa.BIGINT,
        sa.ForeignKey("organization_unique_faces.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    org_unique_face: orm.Mapped[orm_face.OrganizationUniqueFace] = orm.relationship(
        orm_face.OrganizationUniqueFace
    )
    # The notification groups associated with this alert profile
    notification_groups: orm.Mapped[List[orm_notification_group.NotificationGroup]] = (
        orm.relationship(
            orm_notification_group.NotificationGroup, secondary=association_table
        )
    )

    __table_args__ = ((sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),)

    @staticmethod
    async def new_profile(
        session: TenantAwareAsyncSession,
        face_alert_profile: models.FaceAlertProfileCreate,
    ) -> int:
        unique_face = await orm_face.OrganizationUniqueFace.get_unique_face_by_id(
            session=session, org_unique_face_id=face_alert_profile.org_unique_face_id
        )
        if unique_face is None:
            raise FaceAlertProfileNotFoundError(
                f"Unique face with id {face_alert_profile.org_unique_face_id} not found"
            )

        alert = FaceAlertProfile(
            description=face_alert_profile.description,
            is_person_of_interest=face_alert_profile.is_person_of_interest,
            org_unique_face_id=face_alert_profile.org_unique_face_id,
            owner_user_email=face_alert_profile.owner_user_email,
            creation_time=face_alert_profile.creation_time,
            tenant=session.tenant,
        )
        try:
            session.add(alert)
            await session.flush()
        except exc.IntegrityError as e:
            raise DuplicateFaceAlertProfileError(f"Error creating alert profile: {e}")

        return alert.id

    @staticmethod
    async def update_description(
        session: TenantAwareAsyncSession, description: str, alert_profile_id: int
    ) -> None:
        query = sa.select(FaceAlertProfile).where(
            FaceAlertProfile.id == alert_profile_id
        )

        result = (await session.execute(query)).one_or_none()

        if result is None:
            raise FaceAlertProfileNotFoundError(
                f"Alert profile with id {alert_profile_id} not found within"
                " organization"
            )

        result.FaceAlertProfile.description = description

    @staticmethod
    async def update_person_of_interest_flag(
        session: TenantAwareAsyncSession,
        is_person_of_interest: bool,
        alert_profile_id: int,
    ) -> None:
        query = sa.select(FaceAlertProfile).where(
            FaceAlertProfile.id == alert_profile_id
        )
        result = (await session.execute(query)).one_or_none()

        if result is None:
            raise FaceAlertProfileNotFoundError(
                f"Alert profile with id {alert_profile_id} not found within"
                " organization"
            )

        result.FaceAlertProfile.is_person_of_interest = is_person_of_interest

    @staticmethod
    async def update_unique_face_id(
        session: TenantAwareAsyncSession,
        org_unique_face_id_src: int,
        org_unique_face_id_dst: int,
    ) -> None:
        smt = (
            sa.update(FaceAlertProfile)
            .where(FaceAlertProfile.org_unique_face_id == org_unique_face_id_src)
            .values(org_unique_face_id=org_unique_face_id_dst)
        )
        await session.execute(smt)

    @staticmethod
    def _get_profiles_select_clause() -> sa.sql.Select:
        query = (
            sa.select(FaceAlertProfile)
            .options(sa.orm.selectinload(FaceAlertProfile.org_unique_face))
            .options(sa.orm.selectinload(FaceAlertProfile.notification_groups))
            .options(sa.orm.selectinload("notification_groups.members"))
        )
        return query

    @staticmethod
    async def get_profiles(
        session: TenantAwareAsyncSession,
        profile_ids: (
            set[face_models.OrgUniqueFaceIdentifier]
            | set[models.FaceAlertProfileIdentifier]
            | None
        ) = None,
        include_person_of_interest_only: bool = False,
    ) -> list[models.FaceAlertProfile]:
        where_clauses = []

        if include_person_of_interest_only:
            where_clauses.append(FaceAlertProfile.is_person_of_interest == True)

        where_or_clauses = []
        if profile_ids is not None:
            for profile_id in profile_ids:
                # TODO(@lberg): ask Yawei about why we have two cases here
                if isinstance(profile_id, face_models.OrgUniqueFaceIdentifier):
                    where_or_clauses.append(
                        sa.and_(
                            FaceAlertProfile.org_unique_face_id
                            == profile_id.org_unique_face_id
                        )
                    )
                else:
                    where_or_clauses.append(
                        sa.and_(FaceAlertProfile.id == profile_id.alert_profile_id)
                    )

        result = await session.execute(
            FaceAlertProfile._get_profiles_select_clause()
            .where(*where_clauses)
            .where(sa.or_(*where_or_clauses))
            .order_by(FaceAlertProfile.id)
        )
        profiles = result.scalars().all()
        return [models.FaceAlertProfile.from_orm(profile) for profile in profiles]

    @staticmethod
    async def get_profile_by_id(
        session: TenantAwareAsyncSession, alert_profile_id: int
    ) -> models.FaceAlertProfile:
        result = (
            await session.execute(
                FaceAlertProfile._get_profiles_select_clause().where(
                    FaceAlertProfile.id == alert_profile_id
                )
            )
        ).scalar_one_or_none()

        if result is None:
            raise FaceAlertProfileNotFoundError(
                f"Alert profile with id {alert_profile_id} not found within"
                " organization"
            )

        return models.FaceAlertProfile.from_orm(result)

    @staticmethod
    async def update_notification_groups(
        session: TenantAwareAsyncSession,
        alert_profile_id: int,
        notification_group_ids: set[int],
    ) -> None:
        # Get alert profile from database
        query = (
            sa.select(FaceAlertProfile)
            .options(sa.orm.selectinload(FaceAlertProfile.notification_groups))
            .where(FaceAlertProfile.id == alert_profile_id)
        )
        result = (await session.execute(query)).one_or_none()

        if result is None:
            raise FaceAlertProfileNotFoundError(
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
            raise FaceAlertProfileError(
                f"Error updating notification groups for alert profile with id: {e}"
            )

        # Update notification group in alert profile
        result.FaceAlertProfile.notification_groups = notification_groups

    @staticmethod
    async def get_active_alert_profiles(
        session: TenantAwareAsyncSession, org_unique_face_ids: set[int]
    ) -> list[models.FaceAlertProfile]:
        result = await session.execute(
            sa.select(FaceAlertProfile)
            .options(sa.orm.selectinload(FaceAlertProfile.notification_groups))
            .options(sa.orm.selectinload("notification_groups.members"))
            .options(sa.orm.selectinload(FaceAlertProfile.org_unique_face))
            .where(FaceAlertProfile.org_unique_face_id.in_(org_unique_face_ids))
        )
        profiles = result.scalars().all()
        return [models.FaceAlertProfile.from_orm(profile) for profile in profiles]

    @staticmethod
    async def delete_profile(
        session: TenantAwareAsyncSession, alert_profile_id: int
    ) -> None:
        row_count = (
            await session.execute(
                sa.delete(FaceAlertProfile).where(
                    FaceAlertProfile.id == alert_profile_id
                )
            )
        ).rowcount  # type: ignore

        if row_count != 1:
            raise FaceAlertProfileNotFoundError(
                f"Alert profile with id {alert_profile_id} not found within"
                " organization"
            )
