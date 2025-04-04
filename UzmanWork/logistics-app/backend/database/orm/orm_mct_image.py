from __future__ import annotations

from typing import List

import sqlalchemy as sa
from sqlalchemy import and_, or_
from sqlalchemy.engine.row import Row
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import models
from backend.database.orm.orm_utils import TenantProtectedTable, bulk_insert
from backend.database.session import TenantAwareAsyncSession
from backend.s3_utils import S3Path
from backend.utils import AwareDatetime


class MctImageException(Exception):
    pass


class MctImage(TenantProtectedTable):
    __tablename__ = "mct_images"
    # Timestamp this image was recorded at.
    timestamp = sa.Column(sa.TIMESTAMP(timezone=True), nullable=False, primary_key=True)
    # Mac address of camera that recorded this image.
    camera_mac_address = sa.Column(
        sa.String,
        sa.ForeignKey("cameras.mac_address", ondelete="CASCADE"),
        nullable=False,
        primary_key=True,
    )
    # Corresponding track information.
    track_id = sa.Column(sa.Integer, nullable=False, primary_key=True)
    perception_stack_start_id = sa.Column(sa.String, nullable=False, primary_key=True)
    # The S3 path of the image, e.g. "s3://bucket/path/to/mct_image.jpg"
    s3_path = sa.Column(sa.String, nullable=False)

    @staticmethod
    async def get_keys_already_in_db(
        session: TenantAwareAsyncSession, mct_image_batch: List[models.MctImageCreate]
    ) -> set[models.MctImageKey]:
        if len(mct_image_batch) == 0:
            return set()

        where_clauses: list[sa.sql.ClauseElement] = []
        for mct_image in mct_image_batch:
            where_clauses.append(
                and_(
                    MctImage.camera_mac_address == mct_image.camera_mac_address,
                    MctImage.timestamp == mct_image.timestamp,
                    MctImage.track_id == mct_image.track_id,
                )
            )

        query = sa.select(
            MctImage.camera_mac_address, MctImage.timestamp, MctImage.track_id
        ).where(or_(*where_clauses))

        return {
            models.MctImageKey(
                camera_mac_address=mct_key.camera_mac_address,
                timestamp=mct_key.timestamp,
                track_id=mct_key.track_id,
            )
            for mct_key in (await session.execute(query)).all()
        }

    @staticmethod
    async def add_mct_image_batch(
        session: TenantAwareAsyncSession, mct_image_batch: List[models.MctImageCreate]
    ) -> None:
        """Add a batch of thumbnails to the db."""
        await bulk_insert(
            session,
            MctImage,
            [
                dict(
                    timestamp=mct_image.timestamp,
                    camera_mac_address=mct_image.camera_mac_address,
                    s3_path=mct_image.s3_path,
                    track_id=mct_image.track_id,
                    perception_stack_start_id=mct_image.perception_stack_start_id,
                    tenant=session.tenant,
                )
                for mct_image in mct_image_batch
            ],
        )

    @staticmethod
    async def get_track_thumbnail(
        session: TenantAwareAsyncSession,
        track_identifier: models.TrackIdentifier,
        timestamp: AwareDatetime,
    ) -> models.MctImage | None:
        """Queries the corresponding thumbnail s3 path for a given track.

        :param session: db session
        :param timestamp: timestamp of the image
        :param track_identifier: identifier of the track

        :returns: MctImage or None if not found
        most closely - or None if none found"""

        query = sa.select(MctImage).where(
            MctImage.camera_mac_address == track_identifier.mac_address,
            MctImage.track_id == track_identifier.track_id,
            MctImage.perception_stack_start_id
            == track_identifier.perception_stack_start_id,
        )
        results = (await session.execute(query)).all()

        if len(results) == 0:
            return None

        def _time_difference(row: Row) -> float:
            time_diff: float = abs((row.MctImage.timestamp - timestamp).total_seconds())
            return time_diff

        sorted_results = sorted(results, key=_time_difference)
        return models.MctImage.from_orm(sorted_results[0].MctImage)

    @staticmethod
    async def get_tracks_thumbnail(
        session: TenantAwareAsyncSession, track_identifiers: set[models.TrackIdentifier]
    ) -> list[models.MctImage]:
        if len(track_identifiers) == 0:
            return []

        where_clauses: list[sa.sql.ClauseElement] = []
        for track_identifier in track_identifiers:
            where_clauses.append(
                sa.and_(
                    MctImage.track_id == track_identifier.track_id,
                    MctImage.perception_stack_start_id
                    == track_identifier.perception_stack_start_id,
                    MctImage.camera_mac_address == track_identifier.mac_address,
                )
            )

        query = (
            sa.select(MctImage)
            .where(or_(*where_clauses))
            .order_by(
                MctImage.track_id,
                MctImage.perception_stack_start_id,
                MctImage.camera_mac_address,
                MctImage.timestamp,
            )
            .distinct(
                MctImage.track_id,
                MctImage.perception_stack_start_id,
                MctImage.camera_mac_address,
            )
        )
        results = (await session.execute(query)).all()
        return [models.MctImage.from_orm(row.MctImage) for row in results]

    @staticmethod
    async def system_get_retention_data_for_camera(
        session: AsyncSession,
        camera_mac_address: str,
        end: AwareDatetime,
        limit: int | None,
    ) -> list[models.ResourceRetentionData]:
        query = (
            sa.select(MctImage.s3_path, MctImage.timestamp)
            .where(MctImage.camera_mac_address == camera_mac_address)
            .where(MctImage.timestamp <= end)
            .order_by(MctImage.timestamp.asc())
        )
        if limit is not None:
            query = query.limit(limit)
        results = (await session.execute(query)).all()
        return [
            models.ResourceRetentionData(
                s3_paths=[S3Path(row.s3_path)], timestamp=row.timestamp
            )
            for row in results
        ]

    @staticmethod
    async def system_delete_in_range_for_camera(
        session: AsyncSession,
        camera_mac_address: str,
        start: AwareDatetime,
        end: AwareDatetime,
    ) -> None:
        query = (
            sa.delete(MctImage)
            .where(MctImage.camera_mac_address == camera_mac_address)
            .where(MctImage.timestamp >= start)
            .where(MctImage.timestamp <= end)
        )

        await session.execute(query)
