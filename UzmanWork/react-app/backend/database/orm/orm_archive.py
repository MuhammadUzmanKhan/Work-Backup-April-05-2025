from __future__ import annotations

from typing import List

import sqlalchemy as sa
from sqlalchemy import exc, orm

from backend.database import models
from backend.database.orm import orm_tag
from backend.database.orm.orm_clip_data import ClipData
from backend.database.orm.orm_utils import Base, TenantProtectedTable
from backend.database.session import TenantAwareAsyncSession
from backend.utils import AwareDatetime


class ArchiveError(Exception):
    pass


class ArchiveNotFoundError(ArchiveError):
    pass


class ArchiveShareError(ArchiveError):
    pass


class ArchiveUnshareError(ArchiveError):
    pass


class ArchiveDeleteError(ArchiveError):
    pass


class ArchiveClipNotFoundError(ArchiveError):
    pass


class ArchiveClipData(Base):
    __tablename__ = "clips_to_archives"

    clip_id = sa.Column(
        sa.Integer, sa.ForeignKey("clips_data.id", ondelete="CASCADE"), primary_key=True
    )
    archive_id = sa.Column(
        sa.Integer, sa.ForeignKey("archives.id", ondelete="CASCADE"), primary_key=True
    )
    clip_creator_email = sa.Column(
        "clip_creator_email", sa.String, nullable=False, primary_key=True
    )
    clip: orm.Mapped["ClipData"] = orm.relationship("ClipData")
    # Time when the clip was added to the archive
    creation_time = sa.Column(sa.TIMESTAMP(timezone=True), nullable=False)

    @staticmethod
    async def get_archive_clip_data(
        session: TenantAwareAsyncSession, archive_id: int
    ) -> List[models.ArchiveClipData]:
        query = (
            sa.select(ArchiveClipData)
            .options(orm.selectinload(ArchiveClipData.clip))
            .filter(ArchiveClipData.archive_id == archive_id)
            .order_by(ArchiveClipData.creation_time)
        )
        result = await session.execute(query)
        return [models.ArchiveClipData.from_orm(row.ArchiveClipData) for row in result]

    @staticmethod
    async def archive_has_clip(
        session: TenantAwareAsyncSession, archive_id: int, clip_id: int
    ) -> bool:
        query = sa.select(ArchiveClipData.archive_id).filter(
            ArchiveClipData.clip_id == clip_id, ArchiveClipData.archive_id == archive_id
        )
        result = await session.execute(query)
        return result.scalar_one_or_none() is not None


class ArchiveTag(Base):
    __tablename__ = "archive_tags"

    archive_id = sa.Column(
        sa.Integer, sa.ForeignKey("archives.id", ondelete="CASCADE"), primary_key=True
    )
    tag_id = sa.Column(
        sa.Integer, sa.ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True
    )

    @staticmethod
    async def set_archive_tags(
        session: TenantAwareAsyncSession, archive_id: int, tag_ids: list[int]
    ) -> None:
        await session.execute(
            sa.delete(ArchiveTag).where(ArchiveTag.archive_id == archive_id)
        )
        if not tag_ids:
            return

        new_associations = [
            {"archive_id": archive_id, "tag_id": tag_id} for tag_id in tag_ids
        ]
        await session.execute(sa.insert(ArchiveTag).values(new_associations))


class Archive(TenantProtectedTable):
    __tablename__ = "archives"
    # Unique ID for the archive
    id: orm.Mapped[int] = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    # The email address of the archive owner
    owner_user_email = sa.Column(sa.String, nullable=False)
    # The time when the archive was created
    creation_time = sa.Column(sa.TIMESTAMP(timezone=True), nullable=False)
    # Title of the archive
    title = sa.Column(sa.String, nullable=False)
    # Description of the archive
    description = sa.Column(sa.String, nullable=False)
    # Clips data in the archive
    clips: orm.Mapped[List[ArchiveClipData]] = orm.relationship("ArchiveClipData")
    # Archives shared with other users
    share_infos: orm.Mapped[List[SharedArchive]] = orm.relationship("SharedArchive")
    # Comments on the archive case
    comments: orm.Mapped[List[ArchiveComment]] = orm.relationship("ArchiveComment")
    tags: orm.Mapped[List[orm_tag.Tag]] = orm.relationship(
        orm_tag.Tag, secondary=ArchiveTag.__table__
    )

    __table_args__ = ((sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),)

    @staticmethod
    async def create_archive(
        session: TenantAwareAsyncSession, archive_metadata: models.ArchiveCreate
    ) -> Archive:
        """Add new archive to the database

        :param archive_metadata: Object with the fields.
        :return: newly created Archive.
        """
        archive = Archive(
            owner_user_email=archive_metadata.owner_user_email,
            creation_time=archive_metadata.creation_time,
            description=archive_metadata.description,
            title=archive_metadata.title,
            tenant=session.tenant,
        )
        session.add(archive)
        await session.flush()

        await ArchiveTag.set_archive_tags(
            session=session, archive_id=archive.id, tag_ids=archive_metadata.tags
        )

        return archive

    @staticmethod
    async def add_clip_to_archive(
        session: TenantAwareAsyncSession,
        archive_id: int,
        clip_data: ClipData,
        user_email: str,
    ) -> None:
        """Add clip to an existing archive. This action can be performed by the owner
        of the archive or by a user the archive is shared with."""
        clip_metadata = ArchiveClipData(
            clip_creator_email=user_email,
            clip_id=clip_data.id,
            archive_id=archive_id,
            clip=clip_data,
            creation_time=AwareDatetime.utcnow(),
        )
        query = (
            sa.select(Archive)
            .join(SharedArchive, Archive.id == SharedArchive.archive_id, isouter=True)
            .options(orm.selectinload(Archive.clips))
            .filter(Archive.id == archive_id)
            .filter(
                sa.or_(
                    Archive.owner_user_email == user_email,
                    SharedArchive.user_email == user_email,
                )
            )
            .group_by(Archive.id)
        )
        try:
            result = (await session.execute(query)).one()
        except orm.exc.NoResultFound:
            raise ArchiveNotFoundError(
                f"Archive with {archive_id=} not found for {user_email=}"
            )
        result.Archive.clips.append(clip_metadata)

    @staticmethod
    async def delete_archive(
        session: TenantAwareAsyncSession, archive_id: int, user_email: str
    ) -> None:
        """Delete archive from the database by id if it exists, otherwise raise
        an exception
        """
        row_count = (
            await session.execute(
                sa.delete(Archive)
                .where(Archive.id == archive_id)
                .where(Archive.owner_user_email == user_email)
            )
        ).rowcount  # type: ignore

        if row_count != 1:
            raise ArchiveDeleteError(
                f"Expected to delete 1 archive, deleted {row_count=}"
            )

    @staticmethod
    async def get_archives_owned(
        session: TenantAwareAsyncSession, user_email: str
    ) -> List[Archive]:
        """Get all archives from the database

        :return: List of all archives.
        """
        query = (
            sa.select(Archive)
            .options(orm.selectinload(Archive.clips))
            .options(orm.selectinload("clips.clip"))
            .options(orm.selectinload(Archive.share_infos))
            .options(orm.selectinload(Archive.comments))
            .options(orm.selectinload(Archive.tags))
            .filter(Archive.owner_user_email == user_email)
            .order_by(Archive.id)
        )
        result = await session.execute(query)
        return [row.Archive for row in result]

    @staticmethod
    async def update_archive_description(
        session: TenantAwareAsyncSession,
        archive_id: int,
        description: str,
        user_email: str,
    ) -> None:
        query = (
            sa.select(Archive)
            .where(Archive.id == archive_id)
            .where(Archive.owner_user_email == user_email)
        )
        try:
            result = (await session.execute(query)).one()
            result.Archive.description = description
        except orm.exc.NoResultFound:
            raise ArchiveNotFoundError(
                f"Archive with {archive_id=} not found for {user_email=}"
            )

    @staticmethod
    async def admin_only_update_archive_description(
        session: TenantAwareAsyncSession, archive_id: int, description: str
    ) -> None:
        query = sa.select(Archive).where(Archive.id == archive_id)
        try:
            result = (await session.execute(query)).one()
            result.Archive.description = description
        except orm.exc.NoResultFound:
            raise ArchiveNotFoundError(
                f"Archive with {archive_id=} not found for {session.tenant=}"
            )

    @staticmethod
    async def update_archive_title(
        session: TenantAwareAsyncSession, archive_id: int, title: str, user_email: str
    ) -> None:
        query = (
            sa.select(Archive)
            .where(Archive.id == archive_id)
            .where(Archive.owner_user_email == user_email)
        )
        try:
            result = (await session.execute(query)).one()
            result.Archive.title = title
        except orm.exc.NoResultFound:
            raise ArchiveNotFoundError(
                f"Archive with {archive_id=} not found for {user_email=}"
            )

    @staticmethod
    async def admin_only_update_archive_title(
        session: TenantAwareAsyncSession, archive_id: int, title: str
    ) -> None:
        query = sa.select(Archive).where(Archive.id == archive_id)
        try:
            result = (await session.execute(query)).one()
            result.Archive.title = title
        except orm.exc.NoResultFound:
            raise ArchiveNotFoundError(
                f"Archive with {archive_id=} not found for {session.tenant=}"
            )

    @staticmethod
    async def user_owns_archive(
        session: TenantAwareAsyncSession, archive_id: int, user_email: str
    ) -> bool:
        """Returns True if the user owns the archive"""
        stmt = (
            sa.select(Archive.id)
            .where(Archive.id == archive_id)
            .where(Archive.owner_user_email == user_email)
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none() is not None


class ArchiveComment(TenantProtectedTable):
    __tablename__ = "archive_comments"

    id: orm.Mapped[int] = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    archive_id: orm.Mapped[int] = sa.Column(
        sa.Integer, sa.ForeignKey("archives.id", ondelete="CASCADE"), nullable=False
    )
    user_email = sa.Column(sa.String, nullable=False)
    comment = sa.Column(sa.String, nullable=False)
    creation_time = sa.Column(sa.TIMESTAMP(timezone=True), nullable=False)
    __table_args__ = ((sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),)

    @staticmethod
    async def create_comment(
        session: TenantAwareAsyncSession,
        archive_id: int,
        user_email: str,
        comment: str,
        creation_time: AwareDatetime,
    ) -> ArchiveComment:
        archive_comment = ArchiveComment(
            archive_id=archive_id,
            user_email=user_email,
            comment=comment,
            creation_time=creation_time,
            tenant=session.tenant,
        )
        session.add(archive_comment)
        return archive_comment

    @staticmethod
    async def get_archive_comments(
        session: TenantAwareAsyncSession, archive_id: int
    ) -> List[models.ArchiveComment]:
        """Get all comments for an archive"""
        query = (
            sa.select(ArchiveComment)
            .filter(ArchiveComment.archive_id == archive_id)
            .order_by(ArchiveComment.creation_time)
        )
        result = await session.execute(query)
        return [models.ArchiveComment.from_orm(row.ArchiveComment) for row in result]


class SharedArchive(TenantProtectedTable):
    __tablename__ = "shared_archives"
    # The archive id
    archive_id: orm.Mapped[int] = sa.Column(
        sa.Integer, sa.ForeignKey("archives.id", ondelete="CASCADE"), primary_key=True
    )
    # The email address of the user the archive is shared with
    user_email = sa.Column(sa.String, primary_key=True)
    __table_args__ = ((sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),)

    @staticmethod
    async def share_archive(
        session: TenantAwareAsyncSession,
        shared_archive_metadata: models.SharedArchiveCreate,
        user_email: str,
        skip_owner_check: bool = False,
    ) -> SharedArchive:
        # Both the archive owner and admins can share archives
        is_owner = await Archive.user_owns_archive(
            session, shared_archive_metadata.archive_id, user_email
        )
        if not (skip_owner_check or is_owner):
            raise ArchiveNotFoundError(
                f"Archive with {shared_archive_metadata.archive_id=} not found for"
                f" {user_email=}"
            )
        shared_archive = SharedArchive(
            archive_id=shared_archive_metadata.archive_id,
            user_email=shared_archive_metadata.user_email,
            tenant=session.tenant,
        )
        try:
            session.add(shared_archive)
            await session.flush()
        except exc.IntegrityError:
            raise ArchiveShareError(
                f"Archive with {shared_archive_metadata.archive_id=} already shared"
                f" with {shared_archive_metadata.user_email=}"
            )
        return shared_archive

    @staticmethod
    async def unshare_archive(
        session: TenantAwareAsyncSession,
        shared_archive_metadata: models.SharedArchiveCreate,
        user_email: str,
    ) -> None:
        if not await Archive.user_owns_archive(
            session, shared_archive_metadata.archive_id, user_email
        ):
            raise ArchiveNotFoundError(
                f"Archive with {shared_archive_metadata.archive_id=} not found for"
                f" {user_email=}"
            )
        delete_stmt = sa.delete(SharedArchive).where(
            SharedArchive.archive_id == shared_archive_metadata.archive_id,
            SharedArchive.user_email == shared_archive_metadata.user_email,
        )
        row_count = (await session.execute(delete_stmt)).rowcount  # type: ignore
        if row_count != 1:
            raise ArchiveUnshareError(
                f"Expected to unshare 1 archive, unshared {row_count=}"
            )

    @staticmethod
    async def get_archives_shared_with_user(
        session: TenantAwareAsyncSession, user_email: str
    ) -> list[Archive]:
        query = (
            sa.select(Archive)
            .options(orm.selectinload(Archive.clips))
            .options(orm.selectinload(Archive.share_infos))
            .options(orm.selectinload(Archive.comments))
            .options(orm.selectinload(Archive.tags))
            .options(orm.selectinload("clips.clip"))
            .join(SharedArchive, Archive.id == SharedArchive.archive_id)
            .filter(SharedArchive.user_email == user_email)
            .order_by(Archive.id)
        )
        result = await session.execute(query)
        return [row.Archive for row in result]

    @staticmethod
    async def archive_is_shared_with_user(
        session: TenantAwareAsyncSession, archive_id: int, user_email: str
    ) -> bool:
        query = (
            sa.select(SharedArchive)
            .filter(SharedArchive.archive_id == archive_id)
            .filter(SharedArchive.user_email == user_email)
        )
        result = await session.execute(query)
        return result.scalar_one_or_none() is not None

    @staticmethod
    async def get_shared_archives_by_archive_id(
        session: TenantAwareAsyncSession, archive_id: int
    ) -> list[models.SharedArchive]:
        query = sa.select(SharedArchive).filter(SharedArchive.archive_id == archive_id)
        result = await session.execute(query)
        return [models.SharedArchive.from_orm(row.SharedArchive) for row in result]
