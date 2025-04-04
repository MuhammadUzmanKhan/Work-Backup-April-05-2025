from __future__ import annotations

from typing import Any

import sqlalchemy as sa
from sqlalchemy import orm
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import models
from backend.database.orm.orm_utils import TenantProtectedTable
from backend.database.session import TenantAwareAsyncSession
from backend.utils import AwareDatetime


class ClipData(TenantProtectedTable):
    __tablename__ = "clips_data"
    # Unique ID for the clip
    id: orm.Mapped[int] = sa.Column(sa.BigInteger, primary_key=True, autoincrement=True)
    # The camera mac address
    mac_address = sa.Column(
        sa.String,
        sa.ForeignKey("cameras.mac_address", ondelete="CASCADE"),
        nullable=False,
    )
    # The time when the video clip starts
    start_time = sa.Column(sa.TIMESTAMP(timezone=True), nullable=False)
    # The time when the video clip ends
    end_time = sa.Column(sa.TIMESTAMP(timezone=True), nullable=False)
    # The time when the video clip created
    creation_time = sa.Column(sa.TIMESTAMP(timezone=True), nullable=False)
    # The kvs_stream_name of the video clip
    kvs_stream_name = sa.Column(sa.String, nullable=True)
    # The s3_path of the video clip
    s3_path = sa.Column(sa.String, nullable=True)
    # The expiration time of the video clip
    expiration_time = sa.Column(sa.TIMESTAMP(timezone=True), nullable=True)
    # The user can't create a clip data with the same mac address, start time and
    # end time
    __table_args__ = (
        sa.UniqueConstraint(mac_address, start_time, end_time),
        (sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),
    )

    @staticmethod
    async def create_or_retrieve_clip_data(
        session: TenantAwareAsyncSession, clip_data_metadata: models.ClipDataCreate
    ) -> ClipData:
        """Add new clip data to the database. If the clip data already exists, do
        nothing."""

        dict_update = {**clip_data_metadata.dict(), "tenant": session.tenant}
        stmt = insert(ClipData).values(dict_update).on_conflict_do_nothing()

        await session.execute(stmt)
        clip: ClipData = (
            await session.execute(
                sa.select(ClipData)
                .filter(ClipData.mac_address == clip_data_metadata.mac_address)
                .filter(ClipData.start_time == clip_data_metadata.start_time)
                .filter(ClipData.end_time == clip_data_metadata.end_time)
            )
        ).scalar_one()
        return clip

    @staticmethod
    async def system_get_clip_data_by_id(
        session: AsyncSession, clip_id: int
    ) -> ClipData | None:
        return (
            await session.execute(sa.select(ClipData).filter(ClipData.id == clip_id))
        ).scalar_one_or_none()

    @staticmethod
    async def get_clip_data_by_id(
        session: TenantAwareAsyncSession, clip_id: int
    ) -> ClipData | None:
        return await ClipData.system_get_clip_data_by_id(session, clip_id)

    @staticmethod
    async def delete_clip_data_by_id(
        session: TenantAwareAsyncSession, clip_id: int
    ) -> None:
        query = sa.delete(ClipData).where(ClipData.id == clip_id)
        await session.execute(query)

    @staticmethod
    async def update_clip_data_kvs_stream_by_id(
        session: TenantAwareAsyncSession,
        clip_id: int,
        kinesis_stream_name: str,
        stream_expiration_time: AwareDatetime,
    ) -> None:
        stmt = (
            sa.update(ClipData)
            .where(ClipData.id == clip_id)
            .values(
                kvs_stream_name=kinesis_stream_name,
                expiration_time=stream_expiration_time,
            )
        )
        await session.execute(stmt)

    @staticmethod
    async def update_clip_data_s3_path_by_id(
        session: TenantAwareAsyncSession, clip_id: int, s3_path: str
    ) -> None:
        stmt = sa.update(ClipData).where(ClipData.id == clip_id).values(s3_path=s3_path)
        await session.execute(stmt)

    @staticmethod
    async def update_clip_data_s3_path_in_batch(
        session: TenantAwareAsyncSession, responses: list[dict[str, Any]]
    ) -> None:
        def bulk_update_for_session(session: orm.Session) -> None:
            session.bulk_update_mappings(ClipData, responses)

        await session.run_sync(bulk_update_for_session)
