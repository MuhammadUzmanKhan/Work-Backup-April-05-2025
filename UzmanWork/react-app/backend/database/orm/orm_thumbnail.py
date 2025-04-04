from __future__ import annotations

from bisect import bisect_left
from datetime import timedelta
from typing import List

import sqlalchemy as sa
from sqlalchemy import and_, func, or_, orm
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import models
from backend.database.orm.orm_utils import TenantProtectedTable, bulk_insert
from backend.database.session import TenantAwareAsyncSession
from backend.s3_utils import S3Path
from backend.thumbnail.models import (
    ThumbnailResult,
    ThumbnailTimestampRequest,
    TimelapseImageResponse,
)
from backend.utils import AwareDatetime


class ThumbnailError(Exception):
    pass


class EmptyThumbnailRequestError(ThumbnailError):
    pass


class MultipleMacAddressThumbnailRequestError(ThumbnailError):
    pass


class Thumbnail(TenantProtectedTable):
    __tablename__ = "thumbnails"
    id: orm.Mapped[int] = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    # The timestamp of the frame corresponding to the thumbnail#
    timestamp = sa.Column(sa.TIMESTAMP(timezone=True), nullable=False)
    # MAC address of the camera associated with this event
    camera_mac_address = sa.Column(
        sa.String, sa.ForeignKey("cameras.mac_address"), nullable=False
    )
    # The S3 path of the thumbnail, e.g. "s3://bucket/path/to/thumbnail.jpg"
    s3_path = sa.Column(sa.String, nullable=False)
    thumbnail_type = sa.Column(sa.Enum(models.ThumbnailType), nullable=False)

    @staticmethod
    async def add_thumbnail_batch(
        session: TenantAwareAsyncSession,
        thumbnail_metadata_batch: List[models.ThumbnailCreate],
    ) -> None:
        """Add a batch of thumbnails to the db."""
        await bulk_insert(
            session,
            Thumbnail,
            [
                dict(
                    timestamp=thumbnail_metadata.timestamp,
                    camera_mac_address=thumbnail_metadata.camera_mac_address,
                    s3_path=thumbnail_metadata.s3_path,
                    thumbnail_type=thumbnail_metadata.thumbnail_type,
                    tenant=session.tenant,
                )
                for thumbnail_metadata in thumbnail_metadata_batch
            ],
        )

    @staticmethod
    async def sample_thumbnails(
        session: TenantAwareAsyncSession,
        camera_mac_address: str,
        start_time: AwareDatetime,
        end_time: AwareDatetime,
        sample_interval: timedelta,
    ) -> dict[str, ThumbnailResult]:
        """Get the list of thumbnails for a camera given a time range and the
        sample interval.
        Note that the caller is responsible for ensuring that the current user
        has access to the provided camera ID.

        :param camera_mac_address: The MAC address of the camera.
        :param start_time: The start time of the time range.
        :param end_time: The end time of the time range.
        :param sample_interval: The interval between each sample.
        :return: The list of thumbnails.
        """

        # This complex query is needed to get the first thumbnail in each time
        # interval. Inspired by this StackOverflow answer:
        # https://stackoverflow.com/questions/41175109/group-into-interval-of-5-seconds-starting-at-the-minimum

        # Group by the timestamp rounded down to the nearest sample interval.
        total_seconds = sample_interval.total_seconds()
        group_id = func.floor(
            func.extract("epoch", Thumbnail.timestamp) / total_seconds
        ).label("group_id")
        time_group = (
            sa.select(group_id, Thumbnail.timestamp, Thumbnail.s3_path)
            .select_from(Thumbnail)
            .where(Thumbnail.camera_mac_address == camera_mac_address)
            .where(Thumbnail.timestamp >= start_time)
            .where(Thumbnail.timestamp <= end_time)
            .where(Thumbnail.thumbnail_type == models.ThumbnailType.THUMBNAIL)
            .alias("time_group")
        )

        # After that we can get the first thumbnail in each group.
        query = (
            sa.select(
                # time_group.c.X is the column name of the column X in the
                # time_group subquery result.
                time_group.c.group_id,
                time_group.c.timestamp.label("timestamp"),
                time_group.c.s3_path.label("s3_path"),
            )
            .select_from(time_group)
            # Distinct is needed to ensure we get only one row per time_group.
            # ORDER BY is needed to ensure we get the first row in each group.
            # See: https://learnsql.com/blog/postgresql-select-distinct-on/
            .distinct(time_group.c.group_id)
            .order_by(time_group.c.group_id, time_group.c.timestamp)
        )

        result = await session.execute(query)
        rows = result.all()

        return {
            str(idx): ThumbnailResult(timestamp=row.timestamp, s3_path=row.s3_path)
            for idx, row in enumerate(rows)
        }

    @staticmethod
    def _reduce_thumbnails_result(
        results: list[ThumbnailResult], requests: list[ThumbnailTimestampRequest]
    ) -> list[ThumbnailResult | None]:
        """Perform binary search on rows to find the closest timestamp
        for each timestamp in timestamps. Use the threshold included in
        each request to determine if the closest timestamp is within
        the threshold.
        Rows are assumed to be sorted by timestamp.
        """
        response: list[ThumbnailResult | None] = []
        if len(results) == 0:
            return [None] * len(requests)

        rows_timestamps: list[AwareDatetime] = [res.timestamp for res in results]
        for request in requests:
            timestamp = request.timestamp
            tolerance = timedelta(seconds=request.tolerance_s)
            bisect_left_idx = bisect_left(rows_timestamps, timestamp)
            prev_idx = max(bisect_left_idx - 1, 0)
            next_idx = min(bisect_left_idx, len(rows_timestamps) - 1)
            prev_gap = abs(timestamp - rows_timestamps[prev_idx])
            next_gap = abs(rows_timestamps[next_idx] - timestamp)
            if prev_gap <= next_gap and prev_gap <= tolerance:
                result = results[prev_idx]
            elif next_gap <= prev_gap and next_gap <= tolerance:
                result = results[next_idx]
            else:
                response.append(None)
                continue
            response.append(result)
        return response

    @staticmethod
    async def get_thumbnails_at_timestamp(
        session: TenantAwareAsyncSession, requests: List[ThumbnailTimestampRequest]
    ) -> list[ThumbnailResult | None]:
        """Return a list of thumbnails in which the n-th entry represents the
        closest thumbnail to the n-th timestamp (if a thumbnail if found).
        Note that the caller is responsible for ensuring that the current user
        has access to the provided camera ID.

        """
        if len(requests) == 0:
            raise EmptyThumbnailRequestError()

        mac_addresses = set([request.mac_address for request in requests])
        if len(mac_addresses) != 1:
            raise MultipleMacAddressThumbnailRequestError()
        camera_mac_address = mac_addresses.pop()

        # Query all possible thumbnail candidates (thumbnails within
        # tolerance * 2) for all timestamps.
        query = (
            sa.select(Thumbnail.timestamp, Thumbnail.s3_path)
            .select_from(Thumbnail)
            .where(Thumbnail.camera_mac_address == camera_mac_address)
            .where(
                or_(
                    *[
                        and_(
                            Thumbnail.timestamp
                            >= request.timestamp
                            - timedelta(seconds=request.tolerance_s),
                            Thumbnail.timestamp
                            <= request.timestamp
                            + timedelta(seconds=request.tolerance_s),
                        )
                        for request in requests
                    ]
                )
            )
            .where(Thumbnail.thumbnail_type == models.ThumbnailType.THUMBNAIL)
            .order_by(Thumbnail.timestamp)
        )

        result = await session.execute(query)
        rows = result.all()

        thumbnails_results = [ThumbnailResult.from_orm(row) for row in rows]
        # Reduce candidates to 1 per timestamps.
        return Thumbnail._reduce_thumbnails_result(thumbnails_results, requests)

    @staticmethod
    async def get_timelapse_images(
        session: TenantAwareAsyncSession,
        camera_mac_address: str,
        start_time: AwareDatetime,
        end_time: AwareDatetime,
    ) -> list[TimelapseImageResponse]:
        """Return a list of timelapse images for the given camera and time range.

        :param session: the database session
        :param camera_mac_address: the camera mac address
        :param start_time: the start time
        :param end_time: the end time
        :return: a list of timelapse images sorted by timestamp
        """
        query = (
            sa.select(Thumbnail.timestamp, Thumbnail.s3_path)
            .where(Thumbnail.camera_mac_address == camera_mac_address)
            .where(Thumbnail.thumbnail_type == models.ThumbnailType.TIMELAPSE)
            .where(Thumbnail.timestamp >= start_time)
            .where(Thumbnail.timestamp <= end_time)
            .order_by(Thumbnail.timestamp)
        )
        result = await session.execute(query)
        rows = result.all()

        return [
            TimelapseImageResponse(timestamp=row.timestamp, s3_path=row.s3_path)
            for row in rows
        ]

    @staticmethod
    async def get_all_thumbnails_in_time_range(
        session: TenantAwareAsyncSession,
        camera_mac_address: str,
        start_time: AwareDatetime,
        end_time: AwareDatetime,
    ) -> list[ThumbnailResult]:
        query = (
            sa.select(Thumbnail.timestamp, Thumbnail.s3_path)
            .where(Thumbnail.camera_mac_address == camera_mac_address)
            .where(Thumbnail.timestamp >= start_time)
            .where(Thumbnail.timestamp <= end_time)
        )

        result = await session.execute(query)
        rows = result.all()
        return [
            ThumbnailResult(timestamp=row.timestamp, s3_path=row.s3_path)
            for row in rows
        ]

    @staticmethod
    async def system_get_retention_data_for_camera(
        session: AsyncSession,
        camera_mac_address: str,
        end_time: AwareDatetime,
        limit: int | None,
    ) -> list[models.ResourceRetentionData]:
        query = (
            sa.select(Thumbnail.s3_path, Thumbnail.timestamp)
            .where(Thumbnail.camera_mac_address == camera_mac_address)
            .where(Thumbnail.timestamp <= end_time)
            .order_by(Thumbnail.timestamp.asc())
        )
        if limit is not None:
            query = query.limit(limit)
        result = await session.execute(query)
        return [
            models.ResourceRetentionData(
                s3_paths=[S3Path(row.s3_path)], timestamp=row.timestamp
            )
            for row in result.all()
        ]

    @staticmethod
    async def system_delete_in_range_for_camera(
        session: AsyncSession,
        camera_mac_address: str,
        start_time: AwareDatetime,
        end_time: AwareDatetime,
    ) -> None:
        query = (
            sa.delete(Thumbnail)
            .where(Thumbnail.camera_mac_address == camera_mac_address)
            .where(Thumbnail.timestamp >= start_time)
            .where(Thumbnail.timestamp <= end_time)
        )
        await session.execute(query)
