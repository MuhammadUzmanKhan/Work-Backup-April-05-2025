from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy import orm
from sqlalchemy.ext.asyncio import AsyncSession

from backend.constants import UNKNOWN_PERCEPTION_STACK_START_ID
from backend.database import models
from backend.database.orm import orm_camera
from backend.database.orm import orm_license_plate_alert_profile as orm_alert_profile
from backend.database.orm import orm_location, orm_nvr
from backend.database.orm.orm_utils import Base, TenantProtectedTable
from backend.database.session import TenantAwareAsyncSession
from backend.s3_utils import S3Path
from backend.utils import AwareDatetime


class LicensePlateOccurrenceError(Exception):
    pass


class LicensePlateOccurrenceNotFound(LicensePlateOccurrenceError):
    pass


# TODO(@lberg): this is currently not associated to a tenant
# if we do that, we need to drop the primary key on the number
# otherwise we can't have multiple tenants with the same license plate
# Another option is to consider this global and not tenant specific
class LicensePlate(Base):
    __tablename__ = "license_plates"
    # A unique license plate number
    license_plate_number = sa.Column(sa.String, nullable=False, primary_key=True)

    @staticmethod
    async def system_get_or_create(
        session: AsyncSession, license_plate_metadata: models.LicensePlate
    ) -> LicensePlate:
        stmt = sa.select(LicensePlate).where(
            LicensePlate.license_plate_number
            == license_plate_metadata.license_plate_number
        )
        license_plate = (await session.execute(stmt)).scalar_one_or_none()

        if license_plate is None:
            # Create a new license plate
            license_plate = LicensePlate(
                license_plate_number=license_plate_metadata.license_plate_number
            )
            session.add(license_plate)
            await session.flush()

        return license_plate

    @staticmethod
    async def system_get_all(session: AsyncSession) -> list[models.LicensePlate]:
        stmt = sa.select(LicensePlate)
        result = await session.execute(stmt)
        return [models.LicensePlate.from_orm(row) for row in result.scalars().all()]


def _generate_aggregated_license_plate_detection_query(
    start_time: AwareDatetime,
    end_time: AwareDatetime,
    mac_addresses: set[str],
    license_plate_numbers: set[str] | None = None,
) -> sa.sql.Select:
    # TODO: Replace deprecated license_plate field with license_plate_number
    # once all the data has been migrated.
    where_clauses: list[sa.sql.ClauseElement] = [
        sa.between(LicensePlateDetection.time, start_time, end_time),
        LicensePlateDetection.mac_address.in_(mac_addresses),
        LicensePlateDetection.dscore > 0.7,
    ]
    # Only consider the given license plate numbers if they are provided
    if license_plate_numbers is not None:
        where_clauses.append(
            LicensePlateDetection.license_plate.in_(license_plate_numbers)
        )
    # Aggregate license plate detections, keep the detection with highest score
    # per object track
    data_query = (
        sa.select(LicensePlateDetection)
        .where(*where_clauses)
        .order_by(
            LicensePlateDetection.mac_address,
            LicensePlateDetection.perception_stack_start_id,
            LicensePlateDetection.track_id,
            LicensePlateDetection.score.desc(),
        )
        .distinct(
            LicensePlateDetection.mac_address,
            LicensePlateDetection.perception_stack_start_id,
            LicensePlateDetection.track_id,
        )
    )
    return data_query


class LicensePlateDetection(TenantProtectedTable):
    __tablename__ = "license_plate_detections"
    # Event time on the producer side
    time = sa.Column(sa.TIMESTAMP(timezone=True), nullable=False)
    # Deprecated field, use license_plate_number instead
    license_plate = sa.Column(sa.String, nullable=False)
    # (TODO): Remove nullable=True once all the data has been migrated.
    # Detected license plate number
    license_plate_number = sa.Column(
        sa.String, sa.ForeignKey("license_plates.license_plate_number"), nullable=True
    )
    # Confidence level for plate detection.
    dscore = sa.Column(sa.Float, nullable=False, server_default=sa.text("1"))
    # Confidence level for reading the license plate text.
    score = sa.Column(sa.Float, nullable=False)
    # Confidence level for vehicle type prediction.
    # If we cannot find a vehicle, the score is set to 0.
    vscore = sa.Column(sa.Float, nullable=False, server_default=sa.text("1"))
    # MAC address of the camera
    mac_address = sa.Column(
        sa.String,
        sa.ForeignKey("cameras.mac_address", ondelete="CASCADE"),
        nullable=False,
    )
    # The perception stack start ID
    perception_stack_start_id = sa.Column(
        sa.String, nullable=False, server_default=UNKNOWN_PERCEPTION_STACK_START_ID
    )
    # The object ID
    object_id = sa.Column(sa.Integer, nullable=False)
    # The track ID
    track_id = sa.Column(sa.Integer, nullable=False)
    # Path to the original image
    image_s3_path = sa.Column(sa.String, nullable=False)
    # Coordinates of the detected license plate in image coordinates
    x_min = sa.Column(sa.Float, nullable=False)
    y_min = sa.Column(sa.Float, nullable=False)
    x_max = sa.Column(sa.Float, nullable=False)
    y_max = sa.Column(sa.Float, nullable=False)

    # NOTE(@lberg): we might want to drop the foreign key if this gets too slow
    __table_args__ = ((sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),)

    __mapper_args__ = {"primary_key": [time, mac_address, object_id]}

    @staticmethod
    async def add_detection(
        session: TenantAwareAsyncSession,
        detection_metadata: models.LicensePlateDetectionCreate,
    ) -> LicensePlateDetection:
        """Add new license plate detection to the database."""
        detection = LicensePlateDetection(
            time=detection_metadata.time,
            license_plate=detection_metadata.license_plate_number,
            license_plate_number=detection_metadata.license_plate_number,
            score=detection_metadata.score,
            dscore=detection_metadata.dscore,
            vscore=detection_metadata.vscore,
            mac_address=detection_metadata.mac_address,
            perception_stack_start_id=detection_metadata.perception_stack_start_id,
            object_id=detection_metadata.object_id,
            track_id=detection_metadata.track_id,
            image_s3_path=detection_metadata.image_s3_path,
            x_min=detection_metadata.x_min,
            y_min=detection_metadata.y_min,
            x_max=detection_metadata.x_max,
            y_max=detection_metadata.y_max,
            tenant=session.tenant,
        )
        session.add(detection)
        return detection

    @staticmethod
    async def get_occurrences(
        session: TenantAwareAsyncSession,
        start_time: AwareDatetime,
        end_time: AwareDatetime,
        mac_addresses: set[str],
        license_plate_number: str,
    ) -> list[models.LicensePlateEvent]:
        aggregated_detections = _generate_aggregated_license_plate_detection_query(
            start_time=start_time, end_time=end_time, mac_addresses=mac_addresses
        ).subquery()

        query = (
            sa.select(
                aggregated_detections.c.license_plate.label("license_plate_number"),
                aggregated_detections.c.mac_address,
                aggregated_detections.c.time,
            )
            .where(aggregated_detections.c.license_plate == license_plate_number)
            .order_by(aggregated_detections.c.time.desc())
        )

        result = await session.execute(query)
        return [models.LicensePlateEvent.from_orm(row) for row in result.all()]

    @staticmethod
    async def get_last_occurrence_image_data(
        session: TenantAwareAsyncSession, license_plate_number: str
    ) -> models.LicensePlateDetection:
        query = (
            sa.select(LicensePlateDetection)
            .where(LicensePlateDetection.license_plate_number == license_plate_number)
            .order_by(LicensePlateDetection.time.desc())
            .limit(1)
        )
        result = await session.execute(query)
        data = result.scalar_one_or_none()
        if data is None:
            raise LicensePlateOccurrenceNotFound(
                f"License plate {license_plate_number} not found"
            )
        return models.LicensePlateDetection.from_orm(data)

    @staticmethod
    async def get_track_info(
        session: TenantAwareAsyncSession,
        start_time: AwareDatetime,
        end_time: AwareDatetime,
        mac_addresses: set[str],
        license_plate_numbers: set[str] | None = None,
    ) -> list[models.LicensePlateTrackInfo]:
        aggregated_detections = _generate_aggregated_license_plate_detection_query(
            start_time=start_time,
            end_time=end_time,
            mac_addresses=mac_addresses,
            license_plate_numbers=license_plate_numbers,
        ).subquery()

        # Aggregate license plate tracks, one per unique license plate, keep the
        # latest track and count the number of tracks per license plate
        aggregated_tracks = (
            sa.select(
                aggregated_detections.c.license_plate.label("license_plate_number"),
                aggregated_detections.c.mac_address.label("camera_mac_address"),
                aggregated_detections.c.x_min,
                aggregated_detections.c.y_min,
                aggregated_detections.c.x_max,
                aggregated_detections.c.y_max,
                aggregated_detections.c.image_s3_path,
                aggregated_detections.c.time.label("last_seen"),
                sa.func.count()
                .over(partition_by=aggregated_detections.c.license_plate)
                .label("num_occurrences"),
            )
            .distinct(aggregated_detections.c.license_plate)
            .order_by(
                aggregated_detections.c.license_plate,
                aggregated_detections.c.time.desc(),
            )
        ).subquery()

        query = (
            sa.select(
                aggregated_tracks,
                orm_camera.Camera.name.label("camera_name"),
                orm_location.Location.name.label("location_name"),
                orm_alert_profile.LicensePlateAlertProfile,
            )
            .join(
                orm_camera.Camera,
                orm_camera.Camera.mac_address == aggregated_tracks.c.camera_mac_address,
            )
            .join(orm_nvr.NVR, orm_nvr.NVR.uuid == orm_camera.Camera.nvr_uuid)
            .join(
                orm_location.Location,
                orm_nvr.NVR.location_id == orm_location.Location.id,
                isouter=True,
            )
            .join(
                orm_alert_profile.LicensePlateAlertProfile,
                orm_alert_profile.LicensePlateAlertProfile.license_plate_number
                == aggregated_tracks.c.license_plate_number,
                isouter=True,
            )
            .options(
                orm.selectinload(
                    orm_alert_profile.LicensePlateAlertProfile.notification_groups
                )
            )
            .options(sa.orm.selectinload("notification_groups.members"))
            .order_by(aggregated_tracks.c.last_seen.desc())
        )

        result = await session.execute(query)
        return [
            models.LicensePlateTrackInfo(
                license_plate_number=row.license_plate_number,
                camera_mac_address=row.camera_mac_address,
                last_seen=row.last_seen,
                num_occurrences=row.num_occurrences,
                x_min=row.x_min,
                y_min=row.y_min,
                x_max=row.x_max,
                y_max=row.y_max,
                image_s3_path=row.image_s3_path,
                camera_name=row.camera_name,
                location_name=row.location_name,
                alert_profile=row.LicensePlateAlertProfile,
            )
            for row in result
        ]

    @staticmethod
    async def system_get_retention_data_for_camera(
        session: AsyncSession,
        camera_mac_address: str,
        end: AwareDatetime,
        limit: int | None,
    ) -> list[models.ResourceRetentionData]:
        query = (
            sa.select(LicensePlateDetection.image_s3_path, LicensePlateDetection.time)
            .where(LicensePlateDetection.mac_address == camera_mac_address)
            .where(LicensePlateDetection.time <= end)
            .order_by(LicensePlateDetection.time.asc())
        )
        if limit is not None:
            query = query.limit(limit)
        results = (await session.execute(query)).all()
        return [
            models.ResourceRetentionData(
                s3_paths=[S3Path(row.image_s3_path)], timestamp=row.time
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
            sa.delete(LicensePlateDetection)
            .where(LicensePlateDetection.mac_address == camera_mac_address)
            .where(LicensePlateDetection.time >= start)
            .where(LicensePlateDetection.time <= end)
        )

        await session.execute(query)
