from __future__ import annotations

import logging
from datetime import timedelta

import sqlalchemy as sa
from sqlalchemy import func, or_, orm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import elements, expression

from backend import logging_config
from backend.constants import (
    ANALYTICS_TIME_INTERVAL,
    MAX_AGGREGATION_TIME_GAP_S,
    MIN_CONFIDENCE_THRESHOLD,
    MIN_SHORT_EVENT_CONFIDENCE_THRESHOLD,
    SHORT_EVENT_LENGTH,
    UNKNOWN_PERCEPTION_STACK_START_ID,
)
from backend.database import models
from backend.database.dashboard_models import (
    CameraDataSourceWithROI,
    DashboardReportDataError,
    LineCrossingCameraDataSource,
)
from backend.database.geometry_models import Point2D
from backend.database.models import (
    SearchAreaConvexPoly,
    SearchAreaRectangle,
    TrackIdentifier,
)
from backend.database.orm import orm_user_alert
from backend.database.orm.orm_utils import (
    SQL_ARRAY_2D_POLYGON_BOX_INTERSECTS_QUERY,
    SQL_BOX_INTERSECTION_ABOVE_THRESHOLD_QUERY,
    SQL_BOX_INTERSECTS_QUERY,
    SQL_LINE_LINE_INTERSECT_STATEMENT,
    SQL_POLYGON_BOX_INTRESECTS_QUERY,
    TenantProtectedTable,
    bulk_insert,
)
from backend.database.session import TenantAwareAsyncSession
from backend.models import TextSearchResponseMessageBase
from backend.perception.models import (
    AggregationInterval,
    AlertDetectionsInterval,
    DashboardEventCount,
    DashboardEventInterval,
    DashboardTimeBasedEventCount,
    DetectionAnalyticsInterval,
    PerceptionEvent,
    TrackingAnalyticsInterval,
)
from backend.perception.utils import (
    detections_intersection_ratio,
    detections_polygon_intersection_ratio,
)
from backend.utils import AwareDatetime

PERCEPTION_OBJECT_CATEGORY_MAPPING = {
    models.DetectionObjectTypeCategory.VEHICLE: {
        models.DetectionObjectType.CAR,
        models.DetectionObjectType.TRUCK,
        models.DetectionObjectType.BUS,
    },
    models.DetectionObjectTypeCategory.PERSON: {
        models.DetectionObjectType.PERSON,
        models.DetectionObjectType.BICYCLE,
        models.DetectionObjectType.MOTORCYCLE,
    },
    models.DetectionObjectTypeCategory.ANIMAL: {
        models.DetectionObjectType.BIRD,
        models.DetectionObjectType.CAT,
        models.DetectionObjectType.DOG,
        models.DetectionObjectType.HORSE,
        models.DetectionObjectType.SHEEP,
        models.DetectionObjectType.COW,
        models.DetectionObjectType.ELEPHANT,
        models.DetectionObjectType.BEAR,
        models.DetectionObjectType.ZEBRA,
        models.DetectionObjectType.GIRAFFE,
    },
    models.DetectionObjectTypeCategory.MOTION: {models.DetectionObjectType.MOTION},
}


logger = logging.getLogger(logging_config.LOGGER_NAME)


class PerceptionException(Exception):
    pass


def _convert_object_categories_to_types(
    object_categories: list[models.DetectionObjectTypeCategory],
) -> set[models.DetectionObjectType]:
    """
    Converts object categories to their corresponding object detection types according
    to predefined mapping.
    """
    return {
        object_type
        for category in object_categories
        for object_type in PERCEPTION_OBJECT_CATEGORY_MAPPING[category]
    }


def _generate_time_series(
    start_time: AwareDatetime, end_time: AwareDatetime, interval: timedelta
) -> sa.sql.Subquery:
    """
    Generates a time series query that returns all the time intervals between the start
    and end time.
    """
    start_time = start_time.replace(minute=0, second=0, microsecond=0)
    end_time = end_time.replace(minute=0, second=0, microsecond=0)

    # We add an extra timedelta to include the end time in the generated series
    end_time += timedelta(hours=1)

    return (
        sa.select(func.generate_series(start_time, end_time, interval).label("time"))
        .order_by("time")
        .subquery()
    )


def _generate_perception_query_for_user_alert(
    where_clauses: list[sa.sql.ClauseElement],
    alert_trigger_type: models.TriggerType,
    active_alert_setting_ids: set[int],
) -> sa.sql.Select:
    """
    Generates a query that returns all the perception records needed to check
    for user alerts.
    """
    data_query = (
        sa.select(
            PerceptionObjectEvent.time.label("detection_time"),
            PerceptionObjectEvent.track_id.label("detection_track_id"),
            PerceptionObjectEvent.mac_address.label("camera_mac_address"),
            PerceptionObjectEvent.tenant.label("tenant"),
            PerceptionObjectEvent.is_moving.label("is_moving"),
            orm_user_alert.UserAlertSetting.id.label("alert_setting_id"),
            orm_user_alert.UserAlertSetting.trigger_type.label("alert_trigger_type"),
            orm_user_alert.UserAlertSetting.min_idle_duration_s,
        )
        .join(
            orm_user_alert.UserAlertSetting,
            sa.and_(
                orm_user_alert.UserAlertSetting.camera_mac_address
                == PerceptionObjectEvent.mac_address,
                orm_user_alert.UserAlertSetting.trigger_type == alert_trigger_type,
                orm_user_alert.UserAlertSetting.id.in_(active_alert_setting_ids),
            ),
        )
        .where(*where_clauses)
        .order_by(PerceptionObjectEvent.time)
    )

    return data_query


def _generate_user_alert_filter_statements(
    active_alert_setting_ids: set[int],
    active_camera_mac_addresses: set[str],
    alert_trigger_type: models.TriggerType,
    min_confidence: float,
) -> list[sa.sql.ClauseElement]:
    where_clauses: list[sa.sql.ClauseElement] = [
        PerceptionObjectEvent.mac_address.in_(active_camera_mac_addresses),
        PerceptionObjectEvent.object_type
        == expression.func.any(orm_user_alert.UserAlertSetting.detection_object_types),
        PerceptionObjectEvent.confidence >= min_confidence,
        sa.text(
            SQL_ARRAY_2D_POLYGON_BOX_INTERSECTS_QUERY.format(
                roi_polygon="user_alert_settings.roi_polygon"
            )
        ),
        orm_user_alert.UserAlertSetting.id.in_(active_alert_setting_ids),
        orm_user_alert.UserAlertSetting.trigger_type == alert_trigger_type,
    ]
    return where_clauses


def _generate_polygon_search_statement(
    search_polys: list[SearchAreaConvexPoly | SearchAreaRectangle],
    intersection_ratio_threshold: float,
) -> list[elements.TextClause]:
    """Return a list of search statements for the given search polygons.
    :param search_polys: A list of search polygons to check for intersection.
    :param intersection_ratio_threshold: The minimum ratio of the intersection
    :return: A list of search statements for the given search polygons.
    """
    search_statements = []
    for poly in search_polys:
        if isinstance(poly, SearchAreaRectangle):
            search_statements.append(
                sa.text(SQL_BOX_INTERSECTION_ABOVE_THRESHOLD_QUERY).bindparams(
                    sa.bindparam("box_x_min", poly.coord_min.x, type_=sa.Float),
                    sa.bindparam("box_y_min", poly.coord_min.y, type_=sa.Float),
                    sa.bindparam("box_x_max", poly.coord_max.x, type_=sa.Float),
                    sa.bindparam("box_y_max", poly.coord_max.y, type_=sa.Float),
                    sa.bindparam(
                        "intersection_ratio_threshold",
                        intersection_ratio_threshold,
                        type_=sa.Float,
                    ),
                )
            )
        else:
            # NOTE(nedyalko): This solution is not checking the area of
            # the intersection to filter out minimal intersections. For
            # this we need to use PostGIS.
            polygon = ", ".join([f"({p.x}, {p.y})" for p in poly.coords])
            polygon = f"({polygon})"
            search_statements.append(
                sa.text(SQL_POLYGON_BOX_INTRESECTS_QUERY).bindparams(
                    sa.bindparam("polygon", polygon, type_=sa.String)
                )
            )
    return search_statements


def _generate_roi_search_statement(
    camera_data_sources: list[CameraDataSourceWithROI],
) -> list[sa.sql.ClauseElement]:
    search_statements: list[sa.sql.ClauseElement] = []
    # For each camera, we generate a search statement for the ROI
    for data_source in camera_data_sources:
        if len(data_source.roi_polygon) == 0:
            # If the ROI is empty, we search for all detections from the camera
            search_statements.append(
                PerceptionObjectEvent.mac_address == data_source.mac_address
            )
        elif len(data_source.roi_polygon) == 2:
            # If the ROI is a rectangle, we search for detections that intersect
            # with the rectangle
            box = data_source.roi_polygon
            search_statements.append(
                sa.and_(
                    sa.text(SQL_BOX_INTERSECTS_QUERY).bindparams(
                        sa.bindparam("box_x_min", box[0][0], type_=sa.Float),
                        sa.bindparam("box_y_min", box[0][1], type_=sa.Float),
                        sa.bindparam("box_x_max", box[1][0], type_=sa.Float),
                        sa.bindparam("box_y_max", box[1][1], type_=sa.Float),
                    ),
                    PerceptionObjectEvent.mac_address == data_source.mac_address,
                )
            )
        else:
            # If the ROI is a polygon, we search for detections that intersect
            # with the polygon
            polygon = ", ".join([f"({p[0]}, {p[1]})" for p in data_source.roi_polygon])
            polygon = f"({polygon})"
            search_statements.append(
                sa.and_(
                    sa.text(SQL_POLYGON_BOX_INTRESECTS_QUERY).bindparams(
                        sa.bindparam("polygon", polygon, type_=sa.String)
                    ),
                    PerceptionObjectEvent.mac_address == data_source.mac_address,
                )
            )
    return search_statements


def _generate_line_crossing_search_statement(
    detection_query: sa.sql.Alias,
    detection_query_name: str,
    camera_data_sources: list[LineCrossingCameraDataSource],
) -> list[sa.sql.ClauseElement]:
    search_statements: list[sa.sql.ClauseElement] = []
    for data_source in camera_data_sources:
        if data_source.line is None:
            search_statements.append(sa.false())
            continue

        search_statements.append(
            sa.and_(
                sa.text(
                    SQL_LINE_LINE_INTERSECT_STATEMENT.format(
                        detection=detection_query_name
                    )
                ).bindparams(
                    line_start_x=data_source.line.start_point.x,
                    line_start_y=data_source.line.start_point.y,
                    line_end_x=data_source.line.end_point.x,
                    line_end_y=data_source.line.end_point.y,
                    given_direction=data_source.direction.value,
                ),
                detection_query.c.mac_address == data_source.mac_address,
            )
        )
    return search_statements


def _generate_detection_category_statement() -> elements.Case[sa.String]:
    """This function generates a case statement that aggregates the detection
    types into the bigger categories."""
    category_case_statement: elements.Case[sa.String] = sa.case(
        (
            PerceptionObjectEvent.object_type.in_(
                PERCEPTION_OBJECT_CATEGORY_MAPPING[
                    models.DetectionObjectTypeCategory.VEHICLE
                ]
            ),
            models.DetectionObjectTypeCategory.VEHICLE.value,
        ),
        (
            PerceptionObjectEvent.object_type.in_(
                PERCEPTION_OBJECT_CATEGORY_MAPPING[
                    models.DetectionObjectTypeCategory.PERSON
                ]
            ),
            models.DetectionObjectTypeCategory.PERSON.value,
        ),
        (
            PerceptionObjectEvent.object_type.in_(
                PERCEPTION_OBJECT_CATEGORY_MAPPING[
                    models.DetectionObjectTypeCategory.ANIMAL
                ]
            ),
            models.DetectionObjectTypeCategory.ANIMAL.value,
        ),
        (
            PerceptionObjectEvent.object_type.in_(
                PERCEPTION_OBJECT_CATEGORY_MAPPING[
                    models.DetectionObjectTypeCategory.MOTION
                ]
            ),
            models.DetectionObjectTypeCategory.MOTION.value,
        ),
        else_=models.DetectionObjectTypeCategory.UNKNOWN.value,
    )
    return category_case_statement


def _generate_perception_object_query_filters(
    mac_addresses: set[str],
    start_time: AwareDatetime,
    end_time: AwareDatetime,
    moving_detections_only: bool,
    confidence_threshold: float,
    excluded_track_ids: list[int],
    search_polys: list[SearchAreaConvexPoly | SearchAreaRectangle] | None = None,
    intersection_ratio_threshold: float = 0.0,
    detection_classes: set[models.DetectionObjectType] | None = None,
    camera_data_sources: list[CameraDataSourceWithROI] | None = None,
) -> list[sa.sql.ClauseElement]:
    """
    This function generates the where clauses for filtering the perception object query.
    """
    where_clauses: list[sa.sql.ClauseElement] = [
        PerceptionObjectEvent.mac_address.in_(mac_addresses),
        PerceptionObjectEvent.time >= start_time,
        PerceptionObjectEvent.time <= end_time,
    ]

    if moving_detections_only:
        where_clauses.append(PerceptionObjectEvent.is_moving.is_(True))

    if confidence_threshold > 0:
        where_clauses.append(PerceptionObjectEvent.confidence >= confidence_threshold)

    if search_polys is not None and len(search_polys) > 0:
        search_statements = _generate_polygon_search_statement(
            search_polys, intersection_ratio_threshold
        )
        where_clauses.append(sa.or_(*search_statements))

    if len(excluded_track_ids) > 0:
        where_clauses.append(PerceptionObjectEvent.track_id.notin_(excluded_track_ids))

    if detection_classes is not None:
        where_clauses.append(PerceptionObjectEvent.object_type.in_(detection_classes))

    if camera_data_sources is not None:
        roi_search_statements = _generate_roi_search_statement(
            camera_data_sources=camera_data_sources
        )
        where_clauses.append(sa.or_(*roi_search_statements))

    return where_clauses


def _get_aggregated_detection_intervals(
    mac_addresses: set[str],
    start_time: AwareDatetime,
    end_time: AwareDatetime,
    confidence_threshold: float,
    aggregation_time_gap: timedelta,
    min_event_length: timedelta | None = None,
    moving_detections_only: bool = False,
    excluded_track_ids: list[int] | None = None,
    search_polys: list[SearchAreaConvexPoly | SearchAreaRectangle] | None = None,
    intersection_ratio_threshold: float = 0.0,
    short_event_length: timedelta = timedelta(seconds=0),
    short_event_confidence_threshold: float = 0.0,
    camera_data_sources: list[CameraDataSourceWithROI] | None = None,
    detection_classes: set[models.DetectionObjectType] | None = None,
) -> sa.sql.Select:
    category_case_statement = _generate_detection_category_statement()
    where_clauses = _generate_perception_object_query_filters(
        mac_addresses=mac_addresses,
        start_time=start_time,
        end_time=end_time,
        confidence_threshold=confidence_threshold,
        intersection_ratio_threshold=intersection_ratio_threshold,
        search_polys=search_polys,
        camera_data_sources=camera_data_sources,
        detection_classes=detection_classes,
        moving_detections_only=moving_detections_only,
        excluded_track_ids=(
            excluded_track_ids if excluded_track_ids is not None else []
        ),
    )

    data_query = (
        sa.select(
            PerceptionObjectEvent.time,
            PerceptionObjectEvent.confidence,
            PerceptionObjectEvent.mac_address,
            (
                PerceptionObjectEvent.time
                - sa.func.min(PerceptionObjectEvent.time).over(
                    partition_by=[
                        PerceptionObjectEvent.track_id,
                        PerceptionObjectEvent.perception_stack_start_id,
                    ]
                )
            ).label("track_duration"),
            category_case_statement.label("object_category"),
        )
        .where(*where_clauses)
        .subquery()
    )

    # This computes the time gap with the previous detection. We later aggregate
    # consecutive detections depends on the time gap.
    detections = (
        sa.select(
            data_query.c.time,
            data_query.c.mac_address,
            data_query.c.object_category,
            (
                data_query.c.time
                - sa.func.lag(data_query.c.time).over(
                    partition_by=[
                        data_query.c.object_category,
                        data_query.c.mac_address,
                    ],
                    order_by=data_query.c.time,
                )
            ).label("time_gap"),
        )
        .where(
            sa.or_(
                data_query.c.track_duration >= short_event_length,
                sa.and_(
                    data_query.c.track_duration < short_event_length,
                    data_query.c.confidence >= short_event_confidence_threshold,
                ),
            )
        )
        .subquery()
    )
    # Query to group detections by time gap between detections and object category
    grouped_detections = sa.select(
        detections.c.time,
        detections.c.mac_address,
        detections.c.object_category,
        sa.func.count()
        .filter(detections.c.time_gap > aggregation_time_gap)
        .over(
            partition_by=[detections.c.object_category, detections.c.mac_address],
            order_by=detections.c.time,
        )
        .label("group"),
    ).subquery()

    # Query to aggregate detection intervals based on group and object category
    aggregated_intervals = (
        sa.select(
            sa.func.min(grouped_detections.c.time).label("start_time"),
            sa.func.max(grouped_detections.c.time).label("end_time"),
            grouped_detections.c.object_category,
            grouped_detections.c.mac_address,
        )
        .group_by(
            grouped_detections.c.mac_address,
            grouped_detections.c.object_category,
            grouped_detections.c.group,
        )
        .order_by(
            grouped_detections.c.object_category,
            sa.func.min(grouped_detections.c.time),
            grouped_detections.c.mac_address,
        )
    )

    if min_event_length is not None:
        aggregated_intervals = aggregated_intervals.having(
            sa.func.max(grouped_detections.c.time)
            - sa.func.min(grouped_detections.c.time)
            >= min_event_length
        )

    return aggregated_intervals


class PerceptionObjectEvent(TenantProtectedTable):
    # A PerceptionEvent represents an object detected as part of a detection
    __tablename__ = "perception_object_events"
    # Event time on the producer side
    time = sa.Column(sa.TIMESTAMP(timezone=True), nullable=False)
    # MAC address of the camera associated with this event
    mac_address = sa.Column(
        sa.String, sa.ForeignKey("cameras.mac_address"), nullable=False
    )
    # The perception stack start ID
    perception_stack_start_id = sa.Column(
        sa.String, nullable=False, server_default=UNKNOWN_PERCEPTION_STACK_START_ID
    )
    # Type of the detected object
    object_type = sa.Column(sa.Enum(models.DetectionObjectType), nullable=False)
    # Rectangle properties
    x_min = sa.Column(sa.Float, nullable=False)
    y_min = sa.Column(sa.Float, nullable=False)
    x_max = sa.Column(sa.Float, nullable=False)
    y_max = sa.Column(sa.Float, nullable=False)
    # Confidence of the prediction
    confidence = sa.Column(sa.Float, nullable=False)
    # Whether this detection is currently moving
    is_moving = sa.Column(sa.Boolean, nullable=False)
    # The track ID
    track_id = sa.Column(sa.Integer, nullable=False)
    # The track age in seconds
    track_age_s = sa.Column(sa.Float, nullable=False, server_default="-1.0")
    # The index of the object in a given frame, together with the timestamp
    # uniquely identifies a detection.
    # TODO: check all the usages of PerceptionObjectEvent
    object_idx = sa.Column(sa.Integer, nullable=False)

    # This is only used by sqlalchemy ORM, it's not reflected in the database
    __mapper_args__ = {
        "primary_key": [time, mac_address, object_idx, track_id, object_type]
    }

    @staticmethod
    async def add_event_batch(
        session: TenantAwareAsyncSession, perception_events: list[PerceptionEvent]
    ) -> None:
        await bulk_insert(
            session,
            PerceptionObjectEvent,
            [
                dict(
                    time=pcp_event_data.time,
                    mac_address=pcp_event_data.mac_address,
                    perception_stack_start_id=pcp_event_data.perception_stack_start_id,
                    object_type=detection_object_metadata.object_type,
                    x_min=detection_object_metadata.x_min,
                    y_min=detection_object_metadata.y_min,
                    x_max=detection_object_metadata.x_max,
                    y_max=detection_object_metadata.y_max,
                    confidence=detection_object_metadata.confidence,
                    is_moving=detection_object_metadata.is_moving,
                    track_id=detection_object_metadata.track_id,
                    track_age_s=detection_object_metadata.track_age_s,
                    # TODO: switch to object_idx once we finish the migration
                    object_idx=(
                        detection_object_metadata.object_idx
                        if detection_object_metadata.object_idx is not None
                        else detection_object_metadata.idx_in_frame
                    ),
                    tenant=session.tenant,
                )
                for pcp_event_data in perception_events
                # TODO(@lberg): remove [] after VAS-2119 is resolved
                for detection_object_metadata in pcp_event_data.objects or []
            ],
        )

    @staticmethod
    async def filter_detections(
        session: TenantAwareAsyncSession,
        mac_address: str,
        detection_classes: set[models.DetectionObjectType],
        start_time: AwareDatetime | None = None,
        end_time: AwareDatetime | None = None,
        moving_detections_only: bool = False,
        search_polys: list[SearchAreaConvexPoly | SearchAreaRectangle] | None = None,
        intersection_ratio_threshold: float = 0.1,
    ) -> list[models.PerceptionObject]:
        """Filter raw detections based on input params"""
        where_clauses: list[sa.sql.ClauseElement] = [
            PerceptionObjectEvent.mac_address == mac_address,
            PerceptionObjectEvent.object_type.in_(detection_classes),
        ]

        if start_time is not None:
            where_clauses.append(PerceptionObjectEvent.time >= start_time)

        if end_time is not None:
            where_clauses.append(PerceptionObjectEvent.time <= end_time)

        if moving_detections_only:
            where_clauses.append(PerceptionObjectEvent.is_moving.is_(True))

        # TODO(@lberg): consider whether we should filter based on online/offline
        # query individual columns to speed up the query
        query = (
            sa.select(
                PerceptionObjectEvent.time,
                PerceptionObjectEvent.object_type,
                PerceptionObjectEvent.x_min,
                PerceptionObjectEvent.y_min,
                PerceptionObjectEvent.x_max,
                PerceptionObjectEvent.y_max,
            )
            .where(*where_clauses)
            .order_by(PerceptionObjectEvent.object_type, PerceptionObjectEvent.time)
        )
        result = await session.execute(query)

        detections = [
            models.PerceptionObject(
                time=row.time,
                object_type=row.object_type,
                x_min=row.x_min,
                y_min=row.y_min,
                x_max=row.x_max,
                y_max=row.y_max,
            )
            for row in result
        ]

        # Poly filter
        for search_poly in search_polys if search_polys else []:
            if isinstance(search_poly, SearchAreaRectangle):
                ratios = await detections_intersection_ratio(detections, search_poly)
                detections = [
                    detection
                    for detection, ratio in zip(detections, ratios)
                    if ratio > intersection_ratio_threshold
                ]

        return detections

    @staticmethod
    async def query_by_track_id(
        session: TenantAwareAsyncSession,
        mac_address: str,
        track_id: int,
        perception_stack_start_id: str,
        start_time: AwareDatetime,
        end_time: AwareDatetime,
    ) -> list[models.PcpObjectIdentifier]:
        """Query all detections for a given track id.

        :param session: the database session
        :param mac_address: the mac address
        :param track_id: the track id
        :param perception_stack_start_id: the perception stack start id
        :return: the list of detections for the given track id.
        """

        query = sa.select(
            PerceptionObjectEvent.time, PerceptionObjectEvent.object_idx
        ).where(
            PerceptionObjectEvent.mac_address == mac_address,
            PerceptionObjectEvent.track_id == track_id,
            PerceptionObjectEvent.perception_stack_start_id
            == perception_stack_start_id,
            PerceptionObjectEvent.time >= start_time,
            PerceptionObjectEvent.time <= end_time,
        )
        result = await session.execute(query)

        objects = [
            models.PcpObjectIdentifier(timestamp=row.time, object_idx=row.object_idx)
            for row in result
        ]
        return objects

    @staticmethod
    async def query_track_by_object_info(
        session: TenantAwareAsyncSession,
        mac_address: str,
        timestamp: AwareDatetime,
        object_idx: int,
    ) -> list[models.TrackIdentifier]:
        where_clauses: list[sa.sql.ClauseElement] = [
            PerceptionObjectEvent.mac_address == mac_address,
            sa.and_(
                PerceptionObjectEvent.time >= timestamp - timedelta(milliseconds=1),
                PerceptionObjectEvent.time <= timestamp + timedelta(milliseconds=1),
            ),
            PerceptionObjectEvent.object_idx == object_idx,
        ]
        query = sa.select(
            PerceptionObjectEvent.time,
            PerceptionObjectEvent.track_id,
            PerceptionObjectEvent.perception_stack_start_id,
        ).where(*where_clauses)
        results = (await session.execute(query)).all()
        return [
            models.TrackIdentifier(
                mac_address=mac_address,
                track_id=row.track_id,
                perception_stack_start_id=row.perception_stack_start_id,
            )
            for row in results
        ]

    @staticmethod
    async def query_track_life_span(
        session: TenantAwareAsyncSession,
        track: models.TrackIdentifier,
        start_time: AwareDatetime,
        end_time: AwareDatetime,
    ) -> tuple[AwareDatetime, AwareDatetime] | None:
        """Query the life span of an track.

        The life span is defined as the time between the first and last detection of
        the same track.

        :param session: the database session
        :param track: the track identifier
        :return: the life span (start/end time) of the object or None if the object is
        not found.
        """
        where_clauses: list[sa.sql.ClauseElement] = [
            PerceptionObjectEvent.mac_address == track.mac_address,
            PerceptionObjectEvent.track_id == track.track_id,
            PerceptionObjectEvent.perception_stack_start_id
            == track.perception_stack_start_id,
            PerceptionObjectEvent.time >= start_time,
            PerceptionObjectEvent.time <= end_time,
        ]
        query = sa.select(PerceptionObjectEvent.time).where(*where_clauses)
        results = await session.execute(query)
        timestamps = [row.time for row in results]
        return min(timestamps), max(timestamps)

    @staticmethod
    async def aggregate_detections(
        session: TenantAwareAsyncSession,
        mac_address: str,
        start_time: AwareDatetime,
        end_time: AwareDatetime,
        min_event_length: timedelta,
        moving_detections_only: bool = False,
        search_polys: list[SearchAreaConvexPoly | SearchAreaRectangle] | None = None,
        intersection_ratio_threshold: float = 0.0,
        confidence_threshold: float = MIN_CONFIDENCE_THRESHOLD,
        aggregation_time_gap: timedelta = timedelta(seconds=MAX_AGGREGATION_TIME_GAP_S),
        short_event_length: timedelta = SHORT_EVENT_LENGTH,
        short_event_confidence_threshold: float = MIN_SHORT_EVENT_CONFIDENCE_THRESHOLD,
        excluded_track_ids: list[int] | None = None,
    ) -> list[AggregationInterval]:
        """
        Returns the aggregated detections by category.
        Also merges overlapping detections.
        """

        aggregated_intervals = _get_aggregated_detection_intervals(
            mac_addresses={mac_address},
            start_time=start_time,
            end_time=end_time,
            min_event_length=min_event_length,
            moving_detections_only=moving_detections_only,
            confidence_threshold=confidence_threshold,
            aggregation_time_gap=aggregation_time_gap,
            short_event_length=short_event_length,
            short_event_confidence_threshold=short_event_confidence_threshold,
            excluded_track_ids=(
                excluded_track_ids if excluded_track_ids is not None else []
            ),
            search_polys=search_polys,
            intersection_ratio_threshold=intersection_ratio_threshold,
        )
        result = await session.execute(aggregated_intervals)
        return [AggregationInterval.from_orm(row) for row in result]

    @staticmethod
    def _get_detection_analytics(
        start_time: AwareDatetime,
        end_time: AwareDatetime,
        mac_addresses: set[str],
        confidence_threshold: float,
        moving_detections_only: bool = False,
        search_polys: list[SearchAreaConvexPoly | SearchAreaRectangle] | None = None,
        intersection_ratio_threshold: float = 0.0,
        excluded_track_ids: list[int] | None = None,
        detection_classes: set[models.DetectionObjectType] | None = None,
        camera_data_sources: list[CameraDataSourceWithROI] | None = None,
    ) -> sa.sql.Subquery:
        category_case_statement = _generate_detection_category_statement()
        where_clauses = _generate_perception_object_query_filters(
            mac_addresses=mac_addresses,
            start_time=start_time,
            end_time=end_time,
            moving_detections_only=moving_detections_only,
            confidence_threshold=confidence_threshold,
            intersection_ratio_threshold=intersection_ratio_threshold,
            excluded_track_ids=(
                excluded_track_ids if excluded_track_ids is not None else []
            ),
            search_polys=search_polys,
            detection_classes=detection_classes,
            camera_data_sources=camera_data_sources,
        )

        # Query for detected object counts satisfying given search criteria
        # Detection timestamps are truncated to the hour to speed up the follow up
        # query and count the number of detections in each time interval
        detection_analytics = (
            sa.select(
                sa.func.distinct(
                    sa.func.date_trunc("hour", PerceptionObjectEvent.time)
                ).label("time"),
                sa.func.count(
                    sa.func.distinct(
                        PerceptionObjectEvent.track_id,
                        PerceptionObjectEvent.perception_stack_start_id,
                    )
                ).label("object_count"),
                category_case_statement.label("object_category"),
            )
            .where(*where_clauses)
            .group_by("time", "object_category")
            .subquery()
        )
        return detection_analytics

    @staticmethod
    async def get_detection_analytics(
        session: TenantAwareAsyncSession,
        start_time: AwareDatetime,
        end_time: AwareDatetime,
        mac_address: str,
        confidence_threshold: float,
        moving_detections_only: bool = False,
        time_interval: timedelta = ANALYTICS_TIME_INTERVAL,
        search_polys: list[SearchAreaConvexPoly | SearchAreaRectangle] | None = None,
        intersection_ratio_threshold: float = 0.0,
        excluded_track_ids: list[int] | None = None,
    ) -> list[DetectionAnalyticsInterval]:
        """
        This function returns the detection analytics for the given time interval and
        ROI by counting object counts in each time interval for each object category.
        """
        # Query for all detections satisfying given search criteria and compute the
        # track duration for each detection
        detection_analytics = PerceptionObjectEvent._get_detection_analytics(
            start_time=start_time,
            end_time=end_time,
            mac_addresses={mac_address},
            confidence_threshold=confidence_threshold,
            moving_detections_only=moving_detections_only,
            search_polys=search_polys,
            intersection_ratio_threshold=intersection_ratio_threshold,
            excluded_track_ids=excluded_track_ids,
        )

        # Count the number of object detections for each time interval and object
        # category.
        detection_counts = (
            sa.select(
                detection_analytics.c.time.label("time"),
                sa.func.max(
                    sa.case(
                        [
                            (
                                detection_analytics.c.object_category == "person",
                                detection_analytics.c.object_count,
                            )
                        ],
                        else_=0,
                    )
                ).label("person_count"),
                sa.func.max(
                    sa.case(
                        [
                            (
                                detection_analytics.c.object_category == "vehicle",
                                detection_analytics.c.object_count,
                            )
                        ],
                        else_=0,
                    )
                ).label("vehicle_count"),
            )
            .group_by("time")
            .subquery()
        )

        # Generate a series of intervals with the desired length
        time_intervals = _generate_time_series(
            start_time=start_time, end_time=end_time, interval=time_interval
        )

        # Perform a left outer join between the time_intervals and detections
        # to generate a list of time intervals with the corresponding object counts
        # for each category.
        query = (
            sa.select(
                time_intervals.c.time.label("time"),
                sa.func.max(sa.func.coalesce(detection_counts.c.person_count, 0)).label(
                    "person_count"
                ),
                sa.func.max(
                    sa.func.coalesce(detection_counts.c.vehicle_count, 0)
                ).label("vehicle_count"),
            )
            .outerjoin(
                detection_counts,
                sa.and_(
                    detection_counts.c.time
                    >= time_intervals.c.time - time_interval / 2,
                    detection_counts.c.time < time_intervals.c.time + time_interval / 2,
                ),
            )
            .group_by(time_intervals.c.time)
            .order_by("time")
        )

        result = await session.execute(query)
        return [DetectionAnalyticsInterval.from_orm(row) for row in result]

    @staticmethod
    def _get_tracks(
        start_time: AwareDatetime,
        end_time: AwareDatetime,
        mac_addresses: set[str],
        confidence_threshold: float,
        moving_detections_only: bool = False,
        search_polys: list[SearchAreaConvexPoly | SearchAreaRectangle] | None = None,
        intersection_ratio_threshold: float = 0.0,
        excluded_track_ids: list[int] | None = None,
        detection_classes: set[models.DetectionObjectType] | None = None,
        camera_data_sources: list[CameraDataSourceWithROI] | None = None,
    ) -> sa.sql.Subquery:
        """
        This function returns the tracking analytics query for the given time interval
        and ROI by counting number of tracks & track duration for each object category.
        """
        # This aggregates the detection types into the bigger categories.
        category_case_statement = _generate_detection_category_statement()

        # This generates the where clauses for the perception object query.
        where_clauses = _generate_perception_object_query_filters(
            mac_addresses=mac_addresses,
            start_time=start_time,
            end_time=end_time,
            moving_detections_only=moving_detections_only,
            confidence_threshold=confidence_threshold,
            intersection_ratio_threshold=intersection_ratio_threshold,
            excluded_track_ids=(
                excluded_track_ids if excluded_track_ids is not None else []
            ),
            search_polys=search_polys,
            detection_classes=detection_classes,
            camera_data_sources=camera_data_sources,
        )

        # This query returns the tracks with the track duration for each object category
        tracks = (
            sa.select(
                category_case_statement.label("object_category"),
                PerceptionObjectEvent.track_id,
                PerceptionObjectEvent.perception_stack_start_id,
                PerceptionObjectEvent.mac_address,
                (
                    sa.func.max(PerceptionObjectEvent.time)
                    - sa.func.min(PerceptionObjectEvent.time)
                ).label("track_duration"),
            )
            .group_by(
                "object_category",
                "track_id",
                "perception_stack_start_id",
                "mac_address",
            )
            .where(*where_clauses)
            .subquery()
        )
        return tracks

    @staticmethod
    def _get_tracking_analytics(
        start_time: AwareDatetime,
        end_time: AwareDatetime,
        mac_addresses: set[str],
        confidence_threshold: float,
        moving_detections_only: bool = False,
        search_polys: list[SearchAreaConvexPoly | SearchAreaRectangle] | None = None,
        intersection_ratio_threshold: float = 0.0,
        excluded_track_ids: list[int] | None = None,
        detection_classes: set[models.DetectionObjectType] | None = None,
        camera_data_sources: list[CameraDataSourceWithROI] | None = None,
    ) -> sa.sql.Select:
        """
        This function returns the tracking analytics query for the given time interval
        and ROI by counting number of tracks & track duration for each object category.
        """

        tracks = PerceptionObjectEvent._get_tracks(
            start_time=start_time,
            end_time=end_time,
            mac_addresses=mac_addresses,
            confidence_threshold=confidence_threshold,
            moving_detections_only=moving_detections_only,
            search_polys=search_polys,
            intersection_ratio_threshold=intersection_ratio_threshold,
            excluded_track_ids=excluded_track_ids,
            detection_classes=detection_classes,
            camera_data_sources=camera_data_sources,
        )

        tracking_analytics = sa.select(
            tracks.c.object_category,
            sa.func.count(
                sa.func.distinct(
                    tracks.c.track_id,
                    tracks.c.perception_stack_start_id,
                    tracks.c.mac_address,
                )
            ).label("num_tracks"),
            sa.func.avg(tracks.c.track_duration).label("avg_track_duration"),
            sa.func.max(tracks.c.track_duration).label("max_track_duration"),
        ).group_by("object_category")
        return tracking_analytics

    @staticmethod
    async def get_tracking_analytics(
        session: TenantAwareAsyncSession,
        start_time: AwareDatetime,
        end_time: AwareDatetime,
        mac_address: str,
        confidence_threshold: float,
        moving_detections_only: bool = False,
        search_polys: list[SearchAreaConvexPoly | SearchAreaRectangle] | None = None,
        intersection_ratio_threshold: float = 0.0,
        excluded_track_ids: list[int] | None = None,
    ) -> list[TrackingAnalyticsInterval]:
        """
        This function returns the tracking analytics for the given time interval and
        ROI by counting object counts in each time interval for each object category.
        """
        tracking_analytics = PerceptionObjectEvent._get_tracking_analytics(
            start_time,
            end_time,
            {mac_address},
            confidence_threshold,
            moving_detections_only,
            search_polys,
            intersection_ratio_threshold,
            excluded_track_ids,
        )
        result = await session.execute(tracking_analytics)
        return [TrackingAnalyticsInterval.from_orm(row) for row in result]

    @staticmethod
    async def filter_perception_timestamps_with_roi(
        session: TenantAwareAsyncSession,
        mac_address: str,
        results: list[TextSearchResponseMessageBase],
        moving_detections_only: bool = False,
        search_poly: SearchAreaConvexPoly | SearchAreaRectangle | None = None,
        intersection_ratio_threshold: float = 0.1,
    ) -> list[TextSearchResponseMessageBase]:
        """Filter raw detections based on input params
        :param mac_address: mac address used in the filter
        :param results: a list of ranked detections to filter with ROI
        :param moving_detections_only: whether we limit the filter to moving objects
        :param search_poly: polygon to search for events
        :param intersection_ratio_threshold: intersection ratio threshold
        :return: list of roi filtered TextSearchResponse results, ranking is preserved
        """
        logger.info(
            f"filter_perception_timestamps_with_roi: {mac_address=} {results=}"
            f" {search_poly=}"
        )

        if not search_poly:
            logging.warning("No search polygon provided, returning all detections")
            return results

        timestamps = [result.timestamp for result in results]
        object_ids = [result.object_id for result in results]

        # The timestamps we received from NVR will not exactly match
        # what's in the database. Set the match precision to be 10ms.
        conditions = []
        for ts, object_idx in zip(timestamps, object_ids):
            lower_bound = ts - timedelta(milliseconds=1)
            upper_bound = ts + timedelta(milliseconds=1)
            conditions.append(
                sa.and_(
                    PerceptionObjectEvent.time >= lower_bound,
                    PerceptionObjectEvent.time <= upper_bound,
                    PerceptionObjectEvent.object_idx == object_idx,
                )
            )
        where_clauses = [
            PerceptionObjectEvent.mac_address == mac_address,
            or_(*conditions),
        ]

        if moving_detections_only:
            where_clauses.append(PerceptionObjectEvent.is_moving.is_(True))

        query = (
            sa.select(
                PerceptionObjectEvent.time,
                PerceptionObjectEvent.object_type,
                PerceptionObjectEvent.object_idx,
                PerceptionObjectEvent.x_min,
                PerceptionObjectEvent.y_min,
                PerceptionObjectEvent.x_max,
                PerceptionObjectEvent.y_max,
            )
            .where(*where_clauses)
            .order_by(PerceptionObjectEvent.time)
        )
        result = await session.execute(query)

        detections = [
            models.PerceptionObject(
                time=row.time,
                object_type=row.object_type,
                x_min=row.x_min,
                y_min=row.y_min,
                x_max=row.x_max,
                y_max=row.y_max,
            )
            for row in result
        ]

        logging.info(f"Found {len(detections)} detections before geometric filtering.")

        # get all unique timestamps that its detection satisfies the condition
        detection_time_set = set()
        if isinstance(search_poly, SearchAreaConvexPoly):
            timed_ratios = await detections_polygon_intersection_ratio(
                detections, search_poly
            )

            for timed_ratio in timed_ratios:
                if timed_ratio.ratio > intersection_ratio_threshold:
                    detection_time_set.add(timed_ratio.time)

        elif isinstance(search_poly, SearchAreaRectangle):
            ratios = await detections_intersection_ratio(detections, search_poly)
            for detection, ratio in zip(detections, ratios):
                if ratio > intersection_ratio_threshold:
                    detection_time_set.add(detection.time)

        # the timestamps are not exactly the same,
        # we can only match by lowering down the precision.
        rounded_timestamps_sz = [
            ts.isoformat(timespec="milliseconds") for ts in timestamps
        ]
        rounded_detection_time_set = set(
            [ts.isoformat(timespec="milliseconds") for ts in detection_time_set]
        )

        # here we recover the rank order of the timestamps to return
        roi_results = []
        for i in range(len(rounded_timestamps_sz)):
            if rounded_timestamps_sz[i] in rounded_detection_time_set:
                roi_results.append(results[i])
        return roi_results

    @staticmethod
    async def process_roi_or_fail(
        session: TenantAwareAsyncSession,
        mac_address: str,
        roi_polygon: list[list[float]] | None,
        ranked_results: list[TextSearchResponseMessageBase] | None,
    ) -> list[TextSearchResponseMessageBase]:
        """Process ROI filtering or fail if no ranked results are found
        :param session: database session
        :param mac_address: mac address used in the filter
        :param roi_polygon: polygon to search for events. if there's only
            2 points, it's a rectangle.
        :param ranked_results: ranked results to filter with ROI
        :return: list of roi filtered TextSearchResponse results, ranking is preserved
        """
        logger.info(
            f"Processing ROI filtering {mac_address=} {roi_polygon=} {ranked_results=}"
        )
        if ranked_results is None:
            # TODO(@lberg VAS-961): Too generic exception
            raise PerceptionException("No ranked results found for text search")
        if roi_polygon is not None:
            roi = roi_polygon
            # TODO: reduce code redundency with alert/tasks.py
            roi_area: SearchAreaConvexPoly | SearchAreaRectangle | None = None
            if len(roi) == 2:
                roi_area = SearchAreaRectangle(
                    coord_min=Point2D(x=roi[0][0], y=roi[0][1]),
                    coord_max=Point2D(x=roi[1][0], y=roi[1][1]),
                )
            elif len(roi) > 2:
                roi_area = SearchAreaConvexPoly(
                    coords=[Point2D(x=point[0], y=point[1]) for point in roi]
                )
            else:
                # TODO(@lberg VAS-961): Too generic exception
                raise PerceptionException("ROI polygon must have at least 2 points.")

            roi_filtered_ranked_results = (
                await PerceptionObjectEvent.filter_perception_timestamps_with_roi(
                    session=session,
                    mac_address=mac_address,
                    results=ranked_results,
                    moving_detections_only=False,
                    search_poly=roi_area,
                    intersection_ratio_threshold=0.01,
                )
            )
            return roi_filtered_ranked_results
        else:
            return ranked_results

    @staticmethod
    async def system_get_idling_alerts(
        session: AsyncSession,
        min_confidence: float,
        active_alert_setting_ids: set[int],
        active_camera_mac_addresses: set[str],
        query_time: AwareDatetime,
        extra_query_time: timedelta = timedelta(seconds=0),
    ) -> list[AlertDetectionsInterval]:
        """Process idling alert detections
        :param session: database session
        :param active_alert_setting_ids: idling alert settings which are active
        :param query_time: time to query for idling alert detections
        :param extra_query_time: extra time to query for idling alert detections
        :return: a list of AlertDetectionsInterval instances.
        """
        max_db_idle_duration_s = (
            await orm_user_alert.UserAlertSetting.system_get_maximum_idle_duration_s(
                session=session
            )
        )
        if max_db_idle_duration_s is None:
            return []

        alert_pcp_where_clauses = _generate_user_alert_filter_statements(
            active_alert_setting_ids=active_alert_setting_ids,
            active_camera_mac_addresses=active_camera_mac_addresses,
            alert_trigger_type=models.TriggerType.IDLING,
            min_confidence=min_confidence,
        )

        alert_pcp_where_clauses.extend(
            [
                PerceptionObjectEvent.time
                >= (
                    query_time
                    - timedelta(
                        seconds=(max_db_idle_duration_s + extra_query_time.seconds)
                    )
                ),
                PerceptionObjectEvent.time <= query_time,
                # https://stackoverflow.com/questions/31362484/using-a-sqlalchemy-integer-field-
                # to-create-a-timedelta-object-for-filtering/31366623#31366623?
                # newreg=ca4b4d235c2248329f1be6c66dd0770c
                func.age(query_time, PerceptionObjectEvent.time)
                <= func.make_interval(
                    0,  # years
                    0,  # months
                    0,  # weeks
                    0,  # days
                    0,  # hours
                    0,  # mins
                    orm_user_alert.UserAlertSetting.min_idle_duration_s
                    + extra_query_time.seconds,
                ),
            ]
        )

        pcp_data_query = _generate_perception_query_for_user_alert(
            where_clauses=alert_pcp_where_clauses,
            alert_trigger_type=models.TriggerType.IDLING,
            active_alert_setting_ids=active_alert_setting_ids,
        ).subquery()

        partition_query = sa.select(
            pcp_data_query.c.alert_trigger_type,
            pcp_data_query.c.detection_time,
            pcp_data_query.c.camera_mac_address,
            pcp_data_query.c.tenant,
            pcp_data_query.c.min_idle_duration_s,
            (
                pcp_data_query.c.detection_time
                - sa.func.lag(pcp_data_query.c.detection_time).over(
                    partition_by=[
                        pcp_data_query.c.alert_setting_id,
                        pcp_data_query.c.detection_track_id,
                    ],
                    order_by=pcp_data_query.c.detection_time,
                )
            ).label("gap"),
            pcp_data_query.c.alert_setting_id,
            pcp_data_query.c.detection_track_id,
        ).subquery()

        # TODO: how to handle the legacy missing data case?
        interval_query = (
            sa.select(
                func.extract("epoch", sa.func.max(partition_query.c.gap)).label(
                    "max_gap_seconds"
                ),
                sa.func.count(partition_query.c.detection_time).label("num_detections"),
                sa.func.min(partition_query.c.detection_time).label("start_time"),
                sa.func.max(partition_query.c.detection_time).label("end_time"),
                sa.func.max(partition_query.c.min_idle_duration_s).label(
                    "min_idle_duration_s"
                ),
                partition_query.c.detection_track_id,
                partition_query.c.alert_setting_id,
                partition_query.c.alert_trigger_type,
                partition_query.c.camera_mac_address,
                partition_query.c.tenant,
            )
            .group_by(
                partition_query.c.alert_setting_id,
                partition_query.c.detection_track_id,
                partition_query.c.alert_trigger_type,
                partition_query.c.camera_mac_address,
                partition_query.c.tenant,
            )
            .subquery()
        )

        # TODO: should I do joining IdleAlertConfiguration table here?
        # For IDLING, since our query time start from
        # [now - min_idle_duration_s - extra_query_time]
        # and end at now, the max gap between detections must be less than
        # extra_query_time / 2 and the duration of the true idling interval
        # must be >= min_idle_duration_s to be considered as
        # an alert trigger.
        stmt = sa.select(
            interval_query.c.start_time,
            interval_query.c.end_time,
            interval_query.c.alert_setting_id,
            interval_query.c.alert_trigger_type,
            interval_query.c.camera_mac_address,
            interval_query.c.tenant,
        ).where(
            interval_query.c.max_gap_seconds < extra_query_time.seconds / 2,
            func.age(interval_query.c.end_time, interval_query.c.start_time)
            >= func.make_interval(
                0,  # years
                0,  # months
                0,  # weeks
                0,  # days
                0,  # hours
                0,  # mins
                interval_query.c.min_idle_duration_s,  # seconds
            ),
        )

        result = await session.execute(stmt)
        alert_intervals = []
        for row in result.all():
            alert_intervals.append(AlertDetectionsInterval.from_orm(row))
        return alert_intervals

    @staticmethod
    async def system_get_do_not_enter_alerts(
        session: AsyncSession,
        min_confidence: float,
        active_alert_setting_ids: set[int],
        active_camera_mac_addresses: set[str],
        query_time: AwareDatetime,
        min_num_detections: int,
        min_num_moving_detections: int,
        extra_query_time: timedelta = timedelta(seconds=0),
    ) -> list[AlertDetectionsInterval]:
        """Process DO_NOT_ENTER alert detections
        :param session: database session
        :param active_alert_setting_ids: donotenter alert settings which are active
        :param query_time: time to query for idling alert detections
        :param extra_query_time: extra time to query for idling alert detections
        :return: a list of AlertDetectionsInterval instances.
        """

        alert_pcp_where_clauses = _generate_user_alert_filter_statements(
            active_alert_setting_ids=active_alert_setting_ids,
            active_camera_mac_addresses=active_camera_mac_addresses,
            alert_trigger_type=models.TriggerType.DO_NOT_ENTER,
            min_confidence=min_confidence,
        )

        alert_pcp_where_clauses.extend(
            [
                PerceptionObjectEvent.time >= (query_time - extra_query_time),
                PerceptionObjectEvent.time <= query_time,
            ]
        )

        pcp_data_query = _generate_perception_query_for_user_alert(
            where_clauses=alert_pcp_where_clauses,
            alert_trigger_type=models.TriggerType.DO_NOT_ENTER,
            active_alert_setting_ids=active_alert_setting_ids,
        ).subquery()

        partition_query = sa.select(
            pcp_data_query.c.alert_trigger_type,
            pcp_data_query.c.detection_time,
            pcp_data_query.c.is_moving,
            pcp_data_query.c.camera_mac_address,
            pcp_data_query.c.tenant,
            (
                pcp_data_query.c.detection_time
                - sa.func.lag(pcp_data_query.c.detection_time).over(
                    partition_by=[pcp_data_query.c.alert_setting_id],
                    order_by=pcp_data_query.c.detection_time,
                )
            ).label("gap"),
            pcp_data_query.c.alert_setting_id,
            pcp_data_query.c.detection_track_id,
        ).subquery()

        interval_query = (
            sa.select(
                func.extract("epoch", sa.func.max(partition_query.c.gap)).label(
                    "max_gap_seconds"
                ),
                sa.func.count(partition_query.c.detection_time).label("num_detections"),
                sa.func.min(partition_query.c.detection_time).label("start_time"),
                sa.func.max(partition_query.c.detection_time).label("end_time"),
                sa.func.count()
                .filter(partition_query.c.is_moving == True)
                .label("num_moving_detections"),
                partition_query.c.alert_setting_id,
                partition_query.c.alert_trigger_type,
                partition_query.c.camera_mac_address,
                partition_query.c.tenant,
            )
            .group_by(
                partition_query.c.alert_setting_id,
                partition_query.c.alert_trigger_type,
                partition_query.c.camera_mac_address,
                partition_query.c.tenant,
            )
            .subquery()
        )

        # For DO_NOT_ENTER alert, number of detections intersecting
        # the zone must be >= min_num_detections and among them
        # at least min_num_moving_detections must be moving
        # to be considered as an alert trigger.
        stmt = sa.select(
            interval_query.c.start_time,
            interval_query.c.end_time,
            interval_query.c.alert_setting_id,
            interval_query.c.alert_trigger_type,
            interval_query.c.camera_mac_address,
            interval_query.c.tenant,
        ).where(
            interval_query.c.num_detections >= min_num_detections,
            interval_query.c.num_moving_detections >= min_num_moving_detections,
        )
        result = await session.execute(stmt)
        alert_intervals = []
        for row in result.all():
            alert_intervals.append(AlertDetectionsInterval.from_orm(row))
        return alert_intervals

    @staticmethod
    async def get_track_ids_in_interval(
        session: TenantAwareAsyncSession,
        mac_address: str,
        start_time: AwareDatetime,
        end_time: AwareDatetime,
    ) -> list[TrackIdentifier]:
        """Get track ids that are in the interval for the given camera."""
        stmt = (
            sa.select(
                PerceptionObjectEvent.track_id,
                PerceptionObjectEvent.perception_stack_start_id,
            )
            .where(
                PerceptionObjectEvent.mac_address == mac_address,
                PerceptionObjectEvent.time >= start_time,
                PerceptionObjectEvent.time <= end_time,
            )
            .distinct()
        )
        result = await session.execute(stmt)
        return [
            TrackIdentifier(
                mac_address=mac_address,
                track_id=row["track_id"],
                perception_stack_start_id=row["perception_stack_start_id"],
            )
            for row in result.all()
        ]

    @staticmethod
    async def get_activity_count(
        session: TenantAwareAsyncSession,
        camera_data_sources: list[CameraDataSourceWithROI],
        start_time: AwareDatetime,
        end_time: AwareDatetime,
        min_event_length: timedelta,
        max_event_time_gap: timedelta,
        aggregation_time_gap: timedelta,
        confidence_threshold: float,
        object_categories: list[models.DetectionObjectTypeCategory],
    ) -> DashboardEventCount:
        event_intervals = PerceptionObjectEvent._get_event_intervals(
            start_time=start_time,
            end_time=end_time,
            camera_data_sources=camera_data_sources,
            aggregation_time_gap=aggregation_time_gap,
            min_event_length=min_event_length,
            max_event_time_gap=max_event_time_gap,
            confidence_threshold=confidence_threshold,
            detection_classes=_convert_object_categories_to_types(object_categories),
        )
        event_count = sa.select(
            sa.func.count(event_intervals.c.start_time).label("event_count")
        )
        try:
            result = (await session.execute(event_count)).one()
        except orm.exc.NoResultFound:
            raise DashboardReportDataError("Fails to get activity count.")

        return DashboardEventCount.from_orm(result)

    @staticmethod
    async def get_activity_count_over_time(
        session: AsyncSession,
        start_time: AwareDatetime,
        end_time: AwareDatetime,
        camera_data_sources: list[CameraDataSourceWithROI],
        min_event_length: timedelta,
        max_event_time_gap: timedelta,
        aggregation_time_gap: timedelta,
        confidence_threshold: float,
        time_interval: timedelta,
        object_categories: list[models.DetectionObjectTypeCategory],
    ) -> list[DashboardTimeBasedEventCount]:
        event_intervals = (
            PerceptionObjectEvent._get_event_intervals(
                start_time=start_time,
                end_time=end_time,
                camera_data_sources=camera_data_sources,
                aggregation_time_gap=aggregation_time_gap,
                min_event_length=min_event_length,
                max_event_time_gap=max_event_time_gap,
                confidence_threshold=confidence_threshold,
                detection_classes=_convert_object_categories_to_types(
                    object_categories
                ),
            )
        ).subquery()

        # Generate a series of intervals with the desired length
        time_intervals = _generate_time_series(
            start_time=start_time, end_time=end_time, interval=time_interval
        )

        # Count the number of events for each time interval and object category.
        event_counts = (
            sa.select(
                time_intervals.c.time.label("time"),
                sa.func.count(event_intervals.c.start_time).label("event_count"),
            )
            .outerjoin(
                event_intervals,
                sa.and_(
                    event_intervals.c.start_time
                    >= time_intervals.c.time - time_interval / 2,
                    event_intervals.c.start_time
                    < time_intervals.c.time + time_interval / 2,
                ),
            )
            .group_by(time_intervals.c.time)
            .order_by("time")
        )

        result = await session.execute(event_counts)
        return [DashboardTimeBasedEventCount.from_orm(interval) for interval in result]

    @staticmethod
    async def get_activity_intervals(
        session: AsyncSession,
        start_time: AwareDatetime,
        end_time: AwareDatetime,
        camera_data_sources: list[CameraDataSourceWithROI],
        min_event_length: timedelta,
        max_event_time_gap: timedelta,
        aggregation_time_gap: timedelta,
        confidence_threshold: float,
        object_categories: list[models.DetectionObjectTypeCategory],
    ) -> list[DashboardEventInterval]:
        event_intervals = PerceptionObjectEvent._get_event_intervals(
            start_time=start_time,
            end_time=end_time,
            camera_data_sources=camera_data_sources,
            aggregation_time_gap=aggregation_time_gap,
            min_event_length=min_event_length,
            max_event_time_gap=max_event_time_gap,
            confidence_threshold=confidence_threshold,
            detection_classes=_convert_object_categories_to_types(object_categories),
        )
        result = await session.execute(event_intervals)
        return [DashboardEventInterval.from_orm(row) for row in result]

    @staticmethod
    def _get_event_intervals(
        start_time: AwareDatetime,
        end_time: AwareDatetime,
        camera_data_sources: list[CameraDataSourceWithROI],
        aggregation_time_gap: timedelta,
        min_event_length: timedelta,
        max_event_time_gap: timedelta,
        confidence_threshold: float,
        detection_classes: set[models.DetectionObjectType],
    ) -> sa.sql.Select:
        # Get aggregated detection intervals for detections that are separated
        # by less than aggregation_time_gap
        detection_intervals = _get_aggregated_detection_intervals(
            camera_data_sources=camera_data_sources,
            mac_addresses=set(map(lambda x: x.mac_address, camera_data_sources)),
            start_time=start_time,
            end_time=end_time,
            confidence_threshold=confidence_threshold,
            aggregation_time_gap=aggregation_time_gap,
            detection_classes=detection_classes,
        ).subquery()

        # Compute the time gap between each detection interval
        detection_intervals_with_time_gap = sa.select(
            detection_intervals.c.start_time,
            detection_intervals.c.end_time,
            detection_intervals.c.object_category,
            detection_intervals.c.mac_address,
            (
                detection_intervals.c.start_time
                - sa.func.lag(detection_intervals.c.end_time).over(
                    partition_by=[
                        detection_intervals.c.object_category,
                        detection_intervals.c.mac_address,
                    ],
                    order_by=detection_intervals.c.end_time,
                )
            ).label("time_gap"),
        ).subquery()

        # Group detection intervals that are separated by less than max_event_time_gap
        grouped_detection_intervals = sa.select(
            detection_intervals_with_time_gap.c.start_time,
            detection_intervals_with_time_gap.c.end_time,
            detection_intervals_with_time_gap.c.object_category,
            detection_intervals_with_time_gap.c.mac_address,
            (
                (
                    detection_intervals_with_time_gap.c.end_time
                    - detection_intervals_with_time_gap.c.start_time
                )
                >= min_event_length
            ).label("valid_event"),
            sa.func.count()
            .filter(detection_intervals_with_time_gap.c.time_gap > max_event_time_gap)
            .over(
                partition_by=[
                    detection_intervals_with_time_gap.c.object_category,
                    detection_intervals_with_time_gap.c.mac_address,
                ],
                order_by=detection_intervals_with_time_gap.c.start_time,
            )
            .label("group"),
        ).subquery()

        # Get event intervals by grouping detections intervals that are separated by
        # less than max_event_time_gap and have a valid event duration length
        event_intervals = (
            sa.select(
                sa.func.min(grouped_detection_intervals.c.start_time).label(
                    "start_time"
                ),
                sa.func.max(grouped_detection_intervals.c.end_time).label("end_time"),
                grouped_detection_intervals.c.object_category,
                grouped_detection_intervals.c.mac_address,
            )
            .group_by(
                grouped_detection_intervals.c.object_category,
                grouped_detection_intervals.c.mac_address,
                grouped_detection_intervals.c.group,
            )
            .having(
                sa.func.max(
                    sa.cast(grouped_detection_intervals.c.valid_event, sa.Integer)
                )
                == 1
            )
        )
        return event_intervals

    @staticmethod
    def _get_line_crossing_events(
        start_time: AwareDatetime,
        end_time: AwareDatetime,
        detection_classes: set[models.DetectionObjectType],
        camera_data_sources: list[LineCrossingCameraDataSource],
        confidence_threshold: float,
        excluded_track_ids: list[int] | None = None,
        moving_detections_only: bool = False,
    ) -> sa.sql.Subquery:
        # This aggregates the detection types into the bigger categories.
        category_case_statement = _generate_detection_category_statement()

        # This generates the where clauses for the perception object query.
        where_clauses = _generate_perception_object_query_filters(
            mac_addresses=set(map(lambda x: x.mac_address, camera_data_sources)),
            start_time=start_time,
            end_time=end_time,
            detection_classes=detection_classes,
            confidence_threshold=confidence_threshold,
            excluded_track_ids=(
                excluded_track_ids if excluded_track_ids is not None else []
            ),
            moving_detections_only=moving_detections_only,
        )

        # Define common partition window
        window_partition_by: list[sa.sql.ClauseElement] = [
            PerceptionObjectEvent.track_id,
            PerceptionObjectEvent.perception_stack_start_id,
            PerceptionObjectEvent.mac_address,
        ]
        window_order_by = PerceptionObjectEvent.time

        # Query for all detections satisfying given search criteria
        detection_query_name = "detection"
        detection_query = (
            sa.select(
                PerceptionObjectEvent.time,
                PerceptionObjectEvent.track_id,
                PerceptionObjectEvent.perception_stack_start_id,
                PerceptionObjectEvent.mac_address,
                PerceptionObjectEvent.x_min,
                PerceptionObjectEvent.y_min,
                PerceptionObjectEvent.x_max,
                PerceptionObjectEvent.y_max,
                sa.func.lag(PerceptionObjectEvent.x_min, offset=5)
                .over(partition_by=window_partition_by, order_by=window_order_by)
                .label("prev_x_min"),
                sa.func.lag(PerceptionObjectEvent.y_min, offset=5)
                .over(partition_by=window_partition_by, order_by=window_order_by)
                .label("prev_y_min"),
                sa.func.lag(PerceptionObjectEvent.x_max, offset=5)
                .over(partition_by=window_partition_by, order_by=window_order_by)
                .label("prev_x_max"),
                sa.func.lag(PerceptionObjectEvent.y_max, offset=5)
                .over(partition_by=window_partition_by, order_by=window_order_by)
                .label("prev_y_max"),
                category_case_statement.label("object_category"),
            )
            .where(*where_clauses)
            .subquery()
        ).alias(detection_query_name)

        line_crossing_search_statement = _generate_line_crossing_search_statement(
            detection_query, detection_query_name, camera_data_sources
        )
        # Query for line crossing detection
        line_crossing_detections = (
            sa.select(
                detection_query.c.time,
                detection_query.c.object_category,
                detection_query.c.mac_address,
                detection_query.c.track_id,
                detection_query.c.perception_stack_start_id,
            )
            .where(sa.or_(*line_crossing_search_statement))
            .order_by(detection_query.c.mac_address, detection_query.c.time)
            .subquery()
        )
        return line_crossing_detections

    @staticmethod
    async def get_line_crossing_count(
        session: AsyncSession,
        start_time: AwareDatetime,
        end_time: AwareDatetime,
        camera_data_sources: list[LineCrossingCameraDataSource],
        confidence_threshold: float,
        object_categories: list[models.DetectionObjectTypeCategory],
    ) -> DashboardEventCount:
        # Get the line crossing events subquery
        line_crossing_events = PerceptionObjectEvent._get_line_crossing_events(
            start_time=start_time,
            end_time=end_time,
            camera_data_sources=camera_data_sources,
            confidence_threshold=confidence_threshold,
            detection_classes=_convert_object_categories_to_types(object_categories),
        )
        event_count = sa.select(
            sa.func.count(line_crossing_events.c.time).label("event_count")
        )
        try:
            result = (await session.execute(event_count)).one()
        except orm.exc.NoResultFound:
            raise DashboardReportDataError("Fails to get activity count.")

        return DashboardEventCount.from_orm(result)

    @staticmethod
    async def get_line_crossing_count_over_time(
        session: AsyncSession,
        start_time: AwareDatetime,
        end_time: AwareDatetime,
        camera_data_sources: list[LineCrossingCameraDataSource],
        confidence_threshold: float,
        time_interval: timedelta,
        object_categories: list[models.DetectionObjectTypeCategory],
    ) -> list[DashboardTimeBasedEventCount]:
        # Get the line crossing event subquery
        line_crossing_events = PerceptionObjectEvent._get_line_crossing_events(
            start_time=start_time,
            end_time=end_time,
            camera_data_sources=camera_data_sources,
            confidence_threshold=confidence_threshold,
            detection_classes=_convert_object_categories_to_types(object_categories),
        )

        # Generate a series of intervals with the desired length
        time_intervals = _generate_time_series(
            start_time=start_time, end_time=end_time, interval=time_interval
        )

        # Count the number of line crossing detections for each time interval
        event_counts = (
            sa.select(
                time_intervals.c.time.label("time"),
                sa.func.count(line_crossing_events.c.time).label("event_count"),
            )
            .outerjoin(
                line_crossing_events,
                sa.and_(
                    line_crossing_events.c.time
                    >= time_intervals.c.time - time_interval / 2,
                    line_crossing_events.c.time
                    < time_intervals.c.time + time_interval / 2,
                ),
            )
            .group_by(time_intervals.c.time)
            .order_by("time")
        )

        result = await session.execute(event_counts)
        return [DashboardTimeBasedEventCount.from_orm(interval) for interval in result]

    @staticmethod
    async def get_line_crossing_intervals(
        session: AsyncSession,
        start_time: AwareDatetime,
        end_time: AwareDatetime,
        camera_data_sources: list[LineCrossingCameraDataSource],
        confidence_threshold: float,
        object_categories: list[models.DetectionObjectTypeCategory],
    ) -> list[DashboardEventInterval]:
        # Get the line crossing events subquery
        line_crossing_events = PerceptionObjectEvent._get_line_crossing_events(
            start_time=start_time,
            end_time=end_time,
            camera_data_sources=camera_data_sources,
            confidence_threshold=confidence_threshold,
            detection_classes=_convert_object_categories_to_types(object_categories),
        )
        result = await session.execute(
            sa.select(
                line_crossing_events.c.mac_address,
                line_crossing_events.c.object_category,
                # Subtract 3 seconds from detection time to get the start of the clip
                (line_crossing_events.c.time - timedelta(seconds=3)).label(
                    "start_time"
                ),
                # Add 5 seconds to detection time to get the end of the clip
                (line_crossing_events.c.time + timedelta(seconds=5)).label("end_time"),
            )
        )
        return [DashboardEventInterval.from_orm(row) for row in result]

    @staticmethod
    async def get_object_count(
        session: TenantAwareAsyncSession,
        start_time: AwareDatetime,
        end_time: AwareDatetime,
        camera_data_sources: list[CameraDataSourceWithROI],
        confidence_threshold: float,
        object_categories: list[models.DetectionObjectTypeCategory],
    ) -> DashboardEventCount:
        tracking_analytics = PerceptionObjectEvent._get_tracking_analytics(
            start_time=start_time,
            end_time=end_time,
            camera_data_sources=camera_data_sources,
            mac_addresses=set(map(lambda x: x.mac_address, camera_data_sources)),
            confidence_threshold=confidence_threshold,
            detection_classes=_convert_object_categories_to_types(object_categories),
        )
        result = await session.execute(tracking_analytics)
        total_num_tracks = sum(row.num_tracks for row in result)
        return DashboardEventCount(event_count=total_num_tracks)

    @staticmethod
    async def get_object_count_over_time(
        session: TenantAwareAsyncSession,
        start_time: AwareDatetime,
        end_time: AwareDatetime,
        camera_data_sources: list[CameraDataSourceWithROI],
        confidence_threshold: float,
        time_interval: timedelta,
        object_categories: list[models.DetectionObjectTypeCategory],
    ) -> list[DashboardTimeBasedEventCount]:
        # Query for all detections satisfying given search criteria and compute the
        # track duration for each detection
        detection_analytics = PerceptionObjectEvent._get_detection_analytics(
            start_time=start_time,
            end_time=end_time,
            camera_data_sources=camera_data_sources,
            mac_addresses=set(map(lambda x: x.mac_address, camera_data_sources)),
            confidence_threshold=confidence_threshold,
            detection_classes=_convert_object_categories_to_types(object_categories),
        )

        # Generate a series of intervals with the desired length
        time_intervals = _generate_time_series(
            start_time=start_time, end_time=end_time, interval=time_interval
        )

        # Perform a left outer join between the time_intervals and detections
        # to generate a list of time intervals with the corresponding object counts
        # for each category.
        object_counts = (
            sa.select(
                time_intervals.c.time.label("time"),
                sa.func.max(
                    sa.func.coalesce(detection_analytics.c.object_count, 0)
                ).label("event_count"),
            )
            .outerjoin(
                detection_analytics,
                sa.and_(
                    detection_analytics.c.time
                    >= time_intervals.c.time - time_interval / 2,
                    detection_analytics.c.time
                    < time_intervals.c.time + time_interval / 2,
                ),
            )
            .group_by(time_intervals.c.time)
            .order_by("time")
        )
        result = await session.execute(object_counts)
        return [DashboardTimeBasedEventCount.from_orm(row) for row in result]
