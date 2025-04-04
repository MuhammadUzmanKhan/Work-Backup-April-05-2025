from __future__ import annotations

from typing import Optional
from uuid import uuid4

import sqlalchemy as sa
from sqlalchemy import orm
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import models
from backend.database.orm.orm_clip_data import ClipData
from backend.database.orm.orm_utils import TenantProtectedTable
from backend.database.session import TenantAwareAsyncSession
from backend.utils import AwareDatetime


class SharedVideoExpiredError(Exception):
    """Exception raised when a shared video has expired."""

    pass


class SharedVideo(TenantProtectedTable):
    __tablename__ = "shared_videos"
    # Unique hash for the video sharing
    unique_hash: orm.Mapped[str] = sa.Column(sa.String, primary_key=True)
    # Target email address (optional)
    email_address = sa.Column(sa.String, nullable=True)
    # Target phone number (optional)
    phone_number = sa.Column(sa.String, nullable=True)
    # User name of the sender
    user_name = sa.Column(sa.String, nullable=False)
    # The time when the shared video expires
    expiration_time = sa.Column(sa.TIMESTAMP(timezone=True), nullable=False)
    # id of the ClipData record in table clips_data
    clip_id = sa.Column(
        sa.BigInteger,
        sa.ForeignKey(
            "clips_data.id", ondelete="CASCADE", name="shared_videos_clip_id_fkey"
        ),
        nullable=False,
    )
    # Clip data in the shared video
    clip: orm.Mapped[Optional[ClipData]] = orm.relationship("ClipData")
    __table_args__ = ((sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),)

    @staticmethod
    async def create_shared_video(
        session: TenantAwareAsyncSession, shared_video_data: models.SharedVideoCreate
    ) -> str:
        unique_hash = str(uuid4())
        while await SharedVideo.system_shared_video_exists_by_hash(
            session, unique_hash
        ):
            unique_hash = str(uuid4())

        shared_video = SharedVideo(
            unique_hash=unique_hash,
            email_address=shared_video_data.email_address,
            phone_number=shared_video_data.phone_number,
            user_name=shared_video_data.user_name,
            clip_id=shared_video_data.clip_id,
            expiration_time=shared_video_data.expiration_time,
            tenant=session.tenant,
        )
        session.add(shared_video)
        return shared_video.unique_hash

    @staticmethod
    async def system_shared_video_exists_by_hash(
        session: AsyncSession, unique_hash: str
    ) -> bool:
        """Check if a shared video with the given unique hash exists in the DB.

        :param unique_hash: The unique hash of the video.
        :return: True if the video exists, False otherwise.
        """
        query = sa.select(sa.exists().where(SharedVideo.unique_hash == unique_hash))
        result = await session.execute(query)
        return bool(result.scalar())

    @staticmethod
    async def system_get_shared_video(
        session: AsyncSession, unique_hash: str
    ) -> models.SharedVideo:
        """Get the shared video with the given unique hash.

        :param unique_hash: The unique hash of the shared video.
        :return: The metadata for the shared video or None.
        """
        query = (
            sa.select(SharedVideo)
            .options(sa.orm.selectinload(SharedVideo.clip))
            .where(SharedVideo.unique_hash == unique_hash)
        )
        result = (await session.execute(query)).one()

        shared_video = models.SharedVideo.from_orm(result.SharedVideo)

        # check if the shared video has expired
        if shared_video.expiration_time < AwareDatetime.utcnow():
            raise SharedVideoExpiredError("Shared video has expired.")
        else:
            return shared_video
