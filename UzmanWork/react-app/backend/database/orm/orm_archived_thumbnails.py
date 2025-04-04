from __future__ import annotations

from typing import List

import sqlalchemy as sa
from sqlalchemy import and_, func, orm

from backend.database import models
from backend.database.orm.orm_utils import TenantProtectedTable, bulk_insert
from backend.database.session import TenantAwareAsyncSession
from backend.thumbnail.models import ThumbnailResult


class ArchivedThumbnailsNotFound(Exception):
    pass


class ArchivedThumbnail(TenantProtectedTable):
    __tablename__ = "archived_thumbnails"
    id: orm.Mapped[int] = sa.Column(sa.BigInteger, primary_key=True, autoincrement=True)
    # The timestamp of the frame corresponding to the thumbnail
    timestamp = sa.Column(sa.TIMESTAMP(timezone=True), nullable=False)
    # Clip ID on the clip in the archive associated with this thumbnail
    clip_id = sa.Column(
        sa.Integer, sa.ForeignKey("clips_data.id", ondelete="CASCADE"), nullable=False
    )
    # The S3 path of the thumbnail, e.g. "s3://bucket/path/to/thumbnail.jpg"
    s3_path = sa.Column(sa.String, nullable=False)
    # create index on archive_id and clip_id
    __table_args__ = (
        sa.Index("ix_archived_thumbnails_clip_id", "clip_id", unique=False),
    )

    @staticmethod
    async def clip_has_archived_thumbnails(
        session: TenantAwareAsyncSession, clip_id: int
    ) -> bool:
        """Check if a clip has archived thumbnails."""
        query = sa.select(ArchivedThumbnail.clip_id).filter(
            ArchivedThumbnail.clip_id == clip_id
        )
        return (await session.execute(query)).first() is not None

    @staticmethod
    async def add_archive_thumbnail_batch(
        session: TenantAwareAsyncSession,
        thumbnail_metadata_batch: List[models.ArchiveThumbnailCreate],
        clip_id: int,
    ) -> None:
        await bulk_insert(
            session,
            ArchivedThumbnail,
            [
                dict(
                    timestamp=thumbnail_metadata.timestamp,
                    s3_path=thumbnail_metadata.s3_path,
                    clip_id=clip_id,
                    tenant=session.tenant,
                )
                for thumbnail_metadata in thumbnail_metadata_batch
            ],
        )

    @staticmethod
    async def get_archived_thumbnails(
        session: TenantAwareAsyncSession, clip_id: int
    ) -> list[ThumbnailResult]:
        """Get the list of all thumbnails for a given clip sorted by time."""
        query = (
            sa.select(ArchivedThumbnail.timestamp, ArchivedThumbnail.s3_path)
            .where(ArchivedThumbnail.clip_id == clip_id)
            .order_by(ArchivedThumbnail.timestamp)
        )

        result = await session.execute(query)
        rows = result.all()
        if not rows:
            raise ArchivedThumbnailsNotFound(
                f"Archive thumbnails not found for {clip_id=}"
            )
        return [
            ThumbnailResult(timestamp=row.timestamp, s3_path=row.s3_path)
            for row in rows
        ]

    @staticmethod
    async def get_archived_thumbnails_preview(
        session: TenantAwareAsyncSession, clip_ids: list[int]
    ) -> dict[int, ThumbnailResult | None]:
        """Get a single preview thumbnail per clip.
        This thumbnail can be used to offer a preview of the clip content."""

        # Get the median timestamp for each archive
        # NOTE(@lberg): this might not be the exact middle timestamp
        # because of the variable push frequency.
        percentile_subquery = (
            sa.select(
                ArchivedThumbnail.clip_id,
                func.percentile_disc(0.5)
                .within_group(ArchivedThumbnail.timestamp)
                .label("timestamp"),
            )
            .group_by(ArchivedThumbnail.clip_id)
            .where(ArchivedThumbnail.clip_id.in_(clip_ids))
            .subquery()
        )

        # Main query
        query = sa.select(
            ArchivedThumbnail.clip_id,
            ArchivedThumbnail.timestamp,
            ArchivedThumbnail.s3_path,
        ).join(
            percentile_subquery,
            and_(
                ArchivedThumbnail.clip_id == percentile_subquery.c.clip_id,
                ArchivedThumbnail.timestamp == percentile_subquery.c.timestamp,
            ),
        )

        rows = (await session.execute(query)).all()
        result: dict[int, ThumbnailResult | None] = {}

        for row in rows:
            result[row.clip_id] = ThumbnailResult(
                timestamp=row.timestamp, s3_path=row.s3_path
            )

        return result
