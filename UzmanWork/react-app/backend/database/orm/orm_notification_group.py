from __future__ import annotations

from typing import List

import sqlalchemy as sa
from sqlalchemy import orm
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import models
from backend.database.orm.orm_utils import TenantProtectedTable
from backend.database.session import TenantAwareAsyncSession


class NotificationGroupError(Exception):
    pass


class NotificationGroupDuplicatedNameError(NotificationGroupError):
    pass


class NotificationGroupNotFoundError(NotificationGroupError):
    pass


class NotificationGroupMemberNotFoundError(NotificationGroupError):
    pass


class NotificationGroup(TenantProtectedTable):
    __tablename__ = "notification_groups"
    id: orm.Mapped[int] = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    # Name of the group
    name = sa.Column(sa.String, nullable=False)
    # Members of the notification group
    members: orm.Mapped[List[NotificationGroupMember]] = orm.relationship(
        "NotificationGroupMember"
    )
    # No one can create a notification group with the same name in the same org.
    __table_args__ = (
        sa.UniqueConstraint(name, "tenant"),
        sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"]),
    )

    @staticmethod
    async def new_group(session: TenantAwareAsyncSession) -> NotificationGroup:
        # Get the number of notification groups for the tenant
        group_count = await NotificationGroup._get_group_count(session)

        # Come up with a group name which is not already in use
        while True:
            group_name = f"Group {group_count + 1}"
            if not await NotificationGroup._group_name_exists(session, group_name):
                break
            group_count += 1

        notification_group = NotificationGroup(name=group_name, tenant=session.tenant)
        session.add(notification_group)

        try:
            await session.flush()
        except sa.exc.IntegrityError as ex:
            if "violates unique constraint" in str(ex):
                raise NotificationGroupDuplicatedNameError(
                    f"Group name already exists for {group_name=}"
                )
            else:
                raise
        return notification_group

    @staticmethod
    async def get_groups(
        session: TenantAwareAsyncSession, group_ids: set[int] | None = None
    ) -> list[NotificationGroup]:
        where_clause: sa.sql.ClauseElement = sa.true()
        if group_ids is not None:
            where_clause = NotificationGroup.id.in_(group_ids)

        query = (
            sa.select(NotificationGroup)
            .options(orm.selectinload(NotificationGroup.members))
            .where(where_clause)
            .order_by(NotificationGroup.id)
        )
        result = await session.execute(query)

        notification_groups = [row.NotificationGroup for row in result]

        if group_ids is not None and len(group_ids) != len(notification_groups):
            raise NotificationGroupNotFoundError(
                "One or more notification groups not found within organization"
            )

        return notification_groups

    @staticmethod
    async def _get_group_count(session: TenantAwareAsyncSession) -> int:
        query = sa.select(sa.func.count(NotificationGroup.id))
        result = await session.execute(query)
        return int(result.scalar_one())

    @staticmethod
    async def _group_name_exists(
        session: TenantAwareAsyncSession, group_name: str
    ) -> bool:
        query = sa.select(NotificationGroup).where(NotificationGroup.name == group_name)
        result = (await session.execute(query)).scalar_one_or_none()
        return result is not None

    @staticmethod
    async def user_has_access(session: TenantAwareAsyncSession, group_id: int) -> bool:
        query = sa.select(NotificationGroup).where(NotificationGroup.id == group_id)
        result = (await session.execute(query)).scalar_one_or_none()
        return result is not None

    @staticmethod
    async def rename_group_or_raise(
        session: TenantAwareAsyncSession, group_id: int, new_group_name: str
    ) -> None:
        query = sa.select(NotificationGroup).where(NotificationGroup.id == group_id)
        result = (await session.execute(query)).one_or_none()

        if result is None:
            raise NotificationGroupNotFoundError(
                f"Notification group with {group_id=} not found"
            )

        result.NotificationGroup.name = new_group_name

        try:
            await session.flush()
        except sa.exc.IntegrityError as ex:
            if "duplicate key" in str(ex):
                raise NotificationGroupDuplicatedNameError(
                    f"Group name already exists for {new_group_name=}"
                )
            else:
                raise

    @staticmethod
    async def delete_group_or_raise(session: AsyncSession, group_id: int) -> None:
        row_count = (
            await session.execute(
                sa.delete(NotificationGroup).where(NotificationGroup.id == group_id)
            )
        ).rowcount  # type: ignore

        if row_count != 1:
            raise NotificationGroupNotFoundError(
                f"Notification group with {group_id=} not found"
            )


class NotificationGroupMember(TenantProtectedTable):
    __tablename__ = "notification_group_members"
    id: orm.Mapped[int] = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    # Notification group ID to which this notification belongs
    group_id = sa.Column(
        sa.Integer,
        sa.ForeignKey("notification_groups.id", ondelete="CASCADE"),
        nullable=False,
    )
    # User name
    user_name = sa.Column(sa.String, nullable=True)
    # User email address
    email_address = sa.Column(sa.String, nullable=True)
    # User phone number
    phone_number = sa.Column(sa.String, nullable=True)
    __table_args__ = ((sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),)

    @staticmethod
    async def new_group_member(
        session: TenantAwareAsyncSession,
        member_metadata: models.NotificationGroupMemberCreate,
    ) -> NotificationGroupMember:
        new_member = NotificationGroupMember(
            group_id=member_metadata.group_id,
            user_name=member_metadata.user_name,
            email_address=member_metadata.email_address,
            phone_number=member_metadata.phone_number,
            tenant=session.tenant,
        )
        session.add(new_member)
        return new_member

    @staticmethod
    async def update_group_member_or_raise(
        session: TenantAwareAsyncSession,
        member_id: int,
        new_member_metadata: models.NotificationGroupMemberUpdate,
    ) -> None:
        query = (
            sa.select(NotificationGroupMember)
            .where(NotificationGroupMember.id == member_id)
            .join(
                NotificationGroup,
                NotificationGroup.id == NotificationGroupMember.group_id,
            )
        )
        result = (await session.execute(query)).one_or_none()

        if result is None:
            raise NotificationGroupMemberNotFoundError(
                f"Notification group member with {member_id=} not found"
            )

        # Update the notification info
        result.NotificationGroupMember.user_name = new_member_metadata.user_name
        result.NotificationGroupMember.email_address = new_member_metadata.email_address
        result.NotificationGroupMember.phone_number = new_member_metadata.phone_number

    @staticmethod
    async def get_group_member_by_id_or_raise(
        session: TenantAwareAsyncSession, member_id: int
    ) -> models.NotificationGroupMember:
        query = sa.select(NotificationGroupMember).where(
            NotificationGroupMember.id == member_id
        )
        result = (await session.execute(query)).scalar_one_or_none()

        if result is None:
            raise NotificationGroupMemberNotFoundError(
                f"Notification group member with {member_id=} not found"
            )
        return models.NotificationGroupMember.from_orm(result)

    @staticmethod
    async def delete_group_member_or_raise(
        session: TenantAwareAsyncSession, member_id: int
    ) -> None:
        query = (
            sa.select(NotificationGroupMember)
            .join(
                NotificationGroup,
                NotificationGroup.id == NotificationGroupMember.group_id,
            )
            .where(NotificationGroupMember.id == member_id)
        )
        result = (await session.execute(query)).one_or_none()

        if result is None:
            raise NotificationGroupMemberNotFoundError(
                f"Notification group member with {member_id=} not found"
            )

        await session.delete(result.NotificationGroupMember)
