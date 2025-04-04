from datetime import timedelta

import pytest
from pydantic import BaseModel

from backend.constants import (
    ANALYTICS_MIN_CONFIDENCE_THRESHOLD,
    MIN_AGGREGATED_EVENT_LENGTH,
    MIN_CONFIDENCE_THRESHOLD,
    UNKNOWN_PERCEPTION_STACK_START_ID,
)
from backend.database import database, orm
from backend.database.dashboard_models import (
    CameraDataSourceWithROI,
    LineCrossingCameraDataSource,
    LineCrossingDirection,
)
from backend.database.geometry_models import Line2D, Point2D
from backend.database.models import (
    Camera,
    DetectionObjectType,
    DetectionObjectTypeCategory,
    PerceptionObjectCreate,
    SearchAreaConvexPoly,
    SearchAreaRectangle,
)
from backend.database.organization_models import Organization
from backend.perception.models import AggregationInterval, PerceptionEvent
from backend.utils import AwareDatetime

DEFAULT_START_TIME = AwareDatetime.utcnow()
DEFAULT_END_TIME = DEFAULT_START_TIME + timedelta(days=2)
DEFAULT_AGGREGATION_TIME_GAP = timedelta(minutes=10)
DEFAULT_ANALYTICS_TIME_INTERVAL = timedelta(minutes=60)
FULL_SCREEN_ROI = [[0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0]]


class DetectionGenerationConfig(BaseModel):
    detection_type: DetectionObjectType
    num_events: int
    start_track_id: int
    min_corner: Point2D
    max_corner: Point2D
    time_gap: timedelta = DEFAULT_AGGREGATION_TIME_GAP
    start_time: AwareDatetime = DEFAULT_START_TIME
    perception_stack_start_id: str = UNKNOWN_PERCEPTION_STACK_START_ID


def generate_single_type_detections(
    mac_address: str,
    detection_generation_config: DetectionGenerationConfig,
    confidence: float = 0.9,
) -> list[PerceptionEvent]:
    """Util function to generate a list of perception events and a list of
    lists of perception objects for a single detection type.

    :param mac_address: the mac address of the camera
    :param min_corner: the min corner of the detections
    :param max_corner: the max corner of the detections
    :param detection_generation_config: the config for generating detections
    :param confidence: the confidence of the detections
    :return: a tuple of the perception event data and the detection objects
    """
    return generate_detections(
        mac_address=mac_address,
        detection_generation_configs=[detection_generation_config],
        confidence=confidence,
    )


def generate_detections(
    mac_address: str,
    detection_generation_configs: list[DetectionGenerationConfig],
    confidence: float = 0.9,
) -> list[PerceptionEvent]:
    """Util function to generate a list of perception events and a list of
    lists of perception objects for multiple detection types.

    :param mac_address: the mac address of the camera
    :param detection_generation_configs: a list of configs for generating detections
    each detection events batch
    :param confidence: the confidence of the detections
    :return: a tuple of the perception event data and the detection objects
    """
    perception_events = []
    for config in detection_generation_configs:
        cur_time = config.start_time
        for i in range(config.num_events):
            perception_event = PerceptionEvent(
                time=cur_time,
                mac_address=mac_address,
                perception_stack_start_id=(config.perception_stack_start_id),
                objects=[
                    PerceptionObjectCreate(
                        object_type=config.detection_type,
                        x_min=config.min_corner.x,
                        y_min=config.min_corner.y,
                        x_max=config.max_corner.x,
                        y_max=config.max_corner.y,
                        confidence=confidence,
                        is_moving=True,
                        track_id=config.start_track_id + i,
                        object_idx=i + 1,
                        track_age_s=None,
                        idx_in_frame=None,
                    )
                ],
            )
            perception_events.append(perception_event)
            cur_time += config.time_gap

    return perception_events


def check_aggregation(
    aggregation: AggregationInterval,
    expected_start: AwareDatetime,
    expected_end: AwareDatetime,
    expected_type: DetectionObjectTypeCategory,
) -> None:
    """Check an aggregation object for correctness.

    :param aggregation: the aggregation object
    :param expected_start: the expected start time
    :param expected_end: the expected end time
    :param expected_type: the expected detection type
    """
    assert aggregation.object_category == expected_type
    assert (aggregation.start_time - expected_start) < timedelta(seconds=1)
    assert (aggregation.end_time - expected_end) < timedelta(seconds=1)


async def test_aggregate_no_detections(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    """Test that if there are no detections, we return an empty list."""
    search_rects: list[SearchAreaRectangle | SearchAreaConvexPoly] = [
        SearchAreaRectangle(
            coord_min=Point2D(x=0.0, y=0.0), coord_max=Point2D(x=1.0, y=1.0)
        )
    ]
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        aggregated = await orm.PerceptionObjectEvent.aggregate_detections(
            session,
            camera.mac_address,
            DEFAULT_START_TIME,
            DEFAULT_END_TIME,
            search_polys=search_rects,
            min_event_length=MIN_AGGREGATED_EVENT_LENGTH,
        )
    assert aggregated == []


async def test_aggregate_detections_too_short(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    """Test that if the detections are too sparse, we return an empty list."""
    search_rects: list[SearchAreaRectangle | SearchAreaConvexPoly] = [
        SearchAreaRectangle(
            coord_min=Point2D(x=0.0, y=0.0), coord_max=Point2D(x=1.0, y=1.0)
        )
    ]
    # Generate individual detections spanned by more than one aggregation interval
    perception_events = generate_single_type_detections(
        camera.mac_address,
        DetectionGenerationConfig(
            detection_type=DetectionObjectType.PERSON,
            num_events=20,
            time_gap=DEFAULT_AGGREGATION_TIME_GAP * 2,
            start_track_id=0,
            min_corner=Point2D(x=0.0, y=0.0),
            max_corner=Point2D(x=0.5, y=0.5),
        ),
    )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.PerceptionObjectEvent.add_event_batch(session, perception_events)
        aggregated = await orm.PerceptionObjectEvent.aggregate_detections(
            session,
            camera.mac_address,
            DEFAULT_START_TIME,
            DEFAULT_END_TIME,
            search_polys=search_rects,
            aggregation_time_gap=DEFAULT_AGGREGATION_TIME_GAP,
            min_event_length=timedelta(seconds=0.1),
        )
    # We expect no aggregations because the detections are too sparse
    assert aggregated == []


async def test_aggregate_detections_not_in_rect(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    """Test that if the detections are not in the search area, we return an
    empty list.
    """
    search_rects: list[SearchAreaRectangle | SearchAreaConvexPoly] = [
        SearchAreaRectangle(
            coord_min=Point2D(x=0.0, y=0.0), coord_max=Point2D(x=0.5, y=0.5)
        )
    ]
    # Generate individual detections which do not overlap with the search area
    perception_events = generate_single_type_detections(
        camera.mac_address,
        DetectionGenerationConfig(
            detection_type=DetectionObjectType.PERSON,
            num_events=5,
            time_gap=DEFAULT_AGGREGATION_TIME_GAP / 10,
            start_track_id=0,
            min_corner=Point2D(x=0.8, y=0.8),
            max_corner=Point2D(x=1.0, y=1.0),
        ),
    )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.PerceptionObjectEvent.add_event_batch(session, perception_events)
        aggregated = await orm.PerceptionObjectEvent.aggregate_detections(
            session,
            camera.mac_address,
            DEFAULT_START_TIME,
            DEFAULT_END_TIME,
            search_polys=search_rects,
            aggregation_time_gap=DEFAULT_AGGREGATION_TIME_GAP,
            min_event_length=MIN_AGGREGATED_EVENT_LENGTH,
        )
    assert aggregated == []


@pytest.mark.parametrize(
    "search_poly,expect_intersects",
    [
        # Intersecting triangle
        (
            SearchAreaConvexPoly(
                coords=[
                    Point2D(x=0.8, y=0.2),
                    Point2D(x=0.2, y=0.6),
                    Point2D(x=0.9, y=0.8),
                ]
            ),
            True,
        ),
        # Non-intersecting triangle
        (
            SearchAreaConvexPoly(
                coords=[
                    Point2D(x=0.8, y=0.2),
                    Point2D(x=0.6, y=0.6),
                    Point2D(x=0.9, y=0.9),
                ]
            ),
            False,
        ),
        # Polygon inside the detection box
        (
            SearchAreaConvexPoly(
                coords=[
                    Point2D(x=0.2, y=0.1),
                    Point2D(x=0.01, y=0.49),
                    Point2D(x=0.49, y=0.49),
                    Point2D(x=0.3, y=0.1),
                ]
            ),
            True,
        ),
        # Polygon containing the detection box
        (
            SearchAreaConvexPoly(
                coords=[
                    Point2D(x=-1, y=-1),
                    Point2D(x=-0.2, y=1),
                    Point2D(x=1, y=1),
                    Point2D(x=-0.6, y=-1),
                ]
            ),
            True,
        ),
    ],
)
async def test_polygon_intersection(
    search_poly: SearchAreaConvexPoly,
    expect_intersects: bool,
    db_instance: database.Database,
    camera: Camera,
    organization: Organization,
) -> None:
    """Test intersecting with a polygon.

    :param search_poly: An input search polygon.
    :param intersects: Whether the polygon should intersect with the detection.
    """
    search_polys: list[SearchAreaRectangle | SearchAreaConvexPoly] = [search_poly]
    # Generate individual detections with static box
    perception_events = generate_single_type_detections(
        camera.mac_address,
        DetectionGenerationConfig(
            detection_type=DetectionObjectType.PERSON,
            num_events=5,
            time_gap=DEFAULT_AGGREGATION_TIME_GAP / 10,
            start_track_id=0,
            min_corner=Point2D(x=0.0, y=0.0),
            max_corner=Point2D(x=0.5, y=0.5),
        ),
    )
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.PerceptionObjectEvent.add_event_batch(session, perception_events)
        aggregated = await orm.PerceptionObjectEvent.aggregate_detections(
            session,
            camera.mac_address,
            DEFAULT_START_TIME,
            DEFAULT_END_TIME,
            search_polys=search_polys,
            aggregation_time_gap=DEFAULT_AGGREGATION_TIME_GAP,
            min_event_length=MIN_AGGREGATED_EVENT_LENGTH,
        )
    assert (len(aggregated) > 0) == expect_intersects


async def test_aggregate_detections_single_type(
    db_instance: database.Database, organization: Organization, camera: Camera
) -> None:
    """Test that if all detections are of the same type, we aggregate them."""
    search_rects: list[SearchAreaRectangle | SearchAreaConvexPoly] = [
        SearchAreaRectangle(
            coord_min=Point2D(x=0.0, y=0.0), coord_max=Point2D(x=0.5, y=0.5)
        )
    ]
    perception_events = generate_single_type_detections(
        camera.mac_address,
        DetectionGenerationConfig(
            detection_type=DetectionObjectType.PERSON,
            num_events=10,
            time_gap=DEFAULT_AGGREGATION_TIME_GAP / 20,
            start_track_id=0,
            min_corner=Point2D(x=0.3, y=0.3),
            max_corner=Point2D(x=0.4, y=0.4),
        ),
    )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.PerceptionObjectEvent.add_event_batch(session, perception_events)
        aggregated = await orm.PerceptionObjectEvent.aggregate_detections(
            session,
            camera.mac_address,
            DEFAULT_START_TIME,
            DEFAULT_END_TIME,
            search_polys=search_rects,
            aggregation_time_gap=DEFAULT_AGGREGATION_TIME_GAP,
            min_event_length=MIN_AGGREGATED_EVENT_LENGTH,
        )
    assert len(aggregated) == 1
    check_aggregation(
        aggregated[0],
        perception_events[0].time,
        perception_events[-1].time,
        DetectionObjectTypeCategory.PERSON,
    )


async def test_aggregate_detections_multiple_search_areas(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    """Test that if we overlap at least one search area, we aggregate detections."""
    search_rects: list[SearchAreaRectangle | SearchAreaConvexPoly] = [
        SearchAreaRectangle(
            coord_min=Point2D(x=0.0, y=0.0), coord_max=Point2D(x=0.4, y=0.4)
        ),
        SearchAreaRectangle(
            coord_min=Point2D(x=0.5, y=0.5), coord_max=Point2D(x=1.0, y=1.0)
        ),
    ]
    perception_events = generate_single_type_detections(
        camera.mac_address,
        DetectionGenerationConfig(
            detection_type=DetectionObjectType.PERSON,
            num_events=10,
            time_gap=DEFAULT_AGGREGATION_TIME_GAP / 20,
            start_track_id=0,
            min_corner=Point2D(x=0.8, y=0.8),
            max_corner=Point2D(x=0.9, y=0.9),
        ),
    )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.PerceptionObjectEvent.add_event_batch(session, perception_events)
        aggregated = await orm.PerceptionObjectEvent.aggregate_detections(
            session,
            camera.mac_address,
            DEFAULT_START_TIME,
            DEFAULT_END_TIME,
            search_polys=search_rects,
            aggregation_time_gap=DEFAULT_AGGREGATION_TIME_GAP,
            min_event_length=MIN_AGGREGATED_EVENT_LENGTH,
        )
    assert len(aggregated) == 1
    check_aggregation(
        aggregated[0],
        perception_events[0].time,
        perception_events[-1].time,
        DetectionObjectTypeCategory.PERSON,
    )


async def test_aggregate_detections_multiple_type_same_aggregation(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    """Test that even with detections from different types (but same aggregated one),
    we aggregate them in the same aggregation."""
    search_rects: list[SearchAreaRectangle | SearchAreaConvexPoly] = [
        SearchAreaRectangle(
            coord_min=Point2D(x=0.0, y=0.0), coord_max=Point2D(x=0.5, y=0.5)
        )
    ]
    perception_events = generate_single_type_detections(
        camera.mac_address,
        DetectionGenerationConfig(
            detection_type=DetectionObjectType.PERSON,
            num_events=10,
            time_gap=DEFAULT_AGGREGATION_TIME_GAP / 20,
            start_track_id=0,
            min_corner=Point2D(x=0.3, y=0.3),
            max_corner=Point2D(x=0.4, y=0.4),
        ),
    )
    # Replace the detection type with a different type for every even detection
    for perception_event in perception_events[::2]:
        for detection_object in perception_event.objects or []:
            detection_object.object_type = DetectionObjectType.MOTORCYCLE

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.PerceptionObjectEvent.add_event_batch(session, perception_events)
        aggregated = await orm.PerceptionObjectEvent.aggregate_detections(
            session,
            camera.mac_address,
            DEFAULT_START_TIME,
            DEFAULT_END_TIME,
            search_polys=search_rects,
            aggregation_time_gap=DEFAULT_AGGREGATION_TIME_GAP,
            min_event_length=MIN_AGGREGATED_EVENT_LENGTH,
        )
    assert len(aggregated) == 1
    check_aggregation(
        aggregated[0],
        perception_events[0].time,
        perception_events[-1].time,
        DetectionObjectTypeCategory.PERSON,
    )


async def test_aggregate_detections_multiple_type_different_aggregation(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    """Test that if we have detections of different types (even aggregated)
    we should not aggregate them but return them separately."""
    search_rects: list[SearchAreaRectangle | SearchAreaConvexPoly] = [
        SearchAreaRectangle(
            coord_min=Point2D(x=0.0, y=0.0), coord_max=Point2D(x=0.5, y=0.5)
        )
    ]
    perception_events = generate_single_type_detections(
        camera.mac_address,
        DetectionGenerationConfig(
            detection_type=DetectionObjectType.PERSON,
            num_events=10,
            time_gap=DEFAULT_AGGREGATION_TIME_GAP / 20,
            start_track_id=0,
            min_corner=Point2D(x=0.3, y=0.3),
            max_corner=Point2D(x=0.4, y=0.4),
        ),
    )
    # Replace the detection type with a different type for every even detection
    for perception_event in perception_events[::2]:
        for detection_object in perception_event.objects or []:
            detection_object.object_type = DetectionObjectType.CAR

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.PerceptionObjectEvent.add_event_batch(session, perception_events)
        aggregated = await orm.PerceptionObjectEvent.aggregate_detections(
            session,
            camera.mac_address,
            DEFAULT_START_TIME,
            DEFAULT_END_TIME,
            search_polys=search_rects,
            aggregation_time_gap=DEFAULT_AGGREGATION_TIME_GAP,
            min_event_length=MIN_AGGREGATED_EVENT_LENGTH,
        )
    assert len(aggregated) == 2
    # NOTE(@lberg): We sort by type first.
    check_aggregation(
        aggregated[0],
        perception_events[1].time,
        perception_events[-1].time,
        DetectionObjectTypeCategory.PERSON,
    )
    check_aggregation(
        aggregated[1],
        perception_events[0].time,
        perception_events[-2].time,
        DetectionObjectTypeCategory.VEHICLE,
    )


def _generate_sample_detections(camera: Camera) -> list[PerceptionEvent]:
    perception_events = generate_detections(
        mac_address=camera.mac_address,
        detection_generation_configs=[
            DetectionGenerationConfig(
                detection_type=DetectionObjectType.PERSON,
                num_events=10,
                time_gap=timedelta(minutes=0),
                start_track_id=1,
                perception_stack_start_id="0",
                min_corner=Point2D(x=0.3, y=0.3),
                max_corner=Point2D(x=0.4, y=0.4),
            ),
            DetectionGenerationConfig(
                detection_type=DetectionObjectType.PERSON,
                num_events=3,
                start_time=DEFAULT_START_TIME + DEFAULT_ANALYTICS_TIME_INTERVAL,
                time_gap=timedelta(minutes=20),
                start_track_id=1,
                perception_stack_start_id="0",
                min_corner=Point2D(x=0.3, y=0.3),
                max_corner=Point2D(x=0.4, y=0.4),
            ),
            DetectionGenerationConfig(
                detection_type=DetectionObjectType.PERSON,
                num_events=3,
                start_time=DEFAULT_START_TIME + DEFAULT_ANALYTICS_TIME_INTERVAL,
                time_gap=timedelta(minutes=60),
                start_track_id=1,
                perception_stack_start_id="1",
                min_corner=Point2D(x=0.3, y=0.3),
                max_corner=Point2D(x=0.4, y=0.4),
            ),
            DetectionGenerationConfig(
                detection_type=DetectionObjectType.CAR,
                num_events=10,
                time_gap=timedelta(minutes=0),
                start_track_id=100,
                perception_stack_start_id="0",
                min_corner=Point2D(x=0.3, y=0.3),
                max_corner=Point2D(x=0.4, y=0.4),
            ),
        ],
    )
    return perception_events


async def test_detection_analytics(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.PerceptionObjectEvent.add_event_batch(
            session, _generate_sample_detections(camera)
        )
        result = await orm.PerceptionObjectEvent.get_detection_analytics(
            session,
            DEFAULT_START_TIME,
            DEFAULT_END_TIME,
            camera.mac_address,
            confidence_threshold=ANALYTICS_MIN_CONFIDENCE_THRESHOLD,
            time_interval=DEFAULT_ANALYTICS_TIME_INTERVAL,
        )

        assert len(result) == 50
        assert (result[0].person_count == 10) and (result[0].vehicle_count == 10)
        assert (result[1].person_count == 2) and (result[1].vehicle_count == 0)
        assert (result[2].person_count == 1) and (result[2].vehicle_count == 0)
        assert (result[3].person_count == 1) and (result[3].vehicle_count == 0)
        assert (result[4].person_count == 0) and (result[4].vehicle_count == 0)

        # First detection event should be within the first time interval
        assert (
            abs(result[0].time - DEFAULT_START_TIME)
        ) < DEFAULT_ANALYTICS_TIME_INTERVAL
        # Last detection event should not be within the last time interval
        assert (
            abs(result[-1].time - DEFAULT_START_TIME)
        ) > DEFAULT_ANALYTICS_TIME_INTERVAL


async def test_detection_analytics_with_duplicated_pcp_event_entries(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    perception_events = generate_detections(
        mac_address=camera.mac_address,
        detection_generation_configs=[
            DetectionGenerationConfig(
                detection_type=DetectionObjectType.PERSON,
                num_events=10,
                time_gap=timedelta(minutes=0),
                start_track_id=1,
                perception_stack_start_id="0",
                min_corner=Point2D(x=0.3, y=0.3),
                max_corner=Point2D(x=0.4, y=0.4),
            ),
            DetectionGenerationConfig(
                detection_type=DetectionObjectType.CAR,
                num_events=10,
                time_gap=timedelta(minutes=0),
                start_track_id=1,
                perception_stack_start_id="0",
                min_corner=Point2D(x=0.3, y=0.3),
                max_corner=Point2D(x=0.4, y=0.4),
            ),
            DetectionGenerationConfig(
                detection_type=DetectionObjectType.PERSON,
                num_events=4,
                start_time=DEFAULT_START_TIME + DEFAULT_ANALYTICS_TIME_INTERVAL,
                time_gap=timedelta(minutes=20),
                start_track_id=1,
                perception_stack_start_id="0",
                min_corner=Point2D(x=0.3, y=0.3),
                max_corner=Point2D(x=0.4, y=0.4),
            ),
            DetectionGenerationConfig(
                detection_type=DetectionObjectType.PERSON,
                num_events=4,
                start_time=DEFAULT_START_TIME + DEFAULT_ANALYTICS_TIME_INTERVAL,
                time_gap=timedelta(minutes=20),
                start_track_id=1,
                perception_stack_start_id="0",
                min_corner=Point2D(x=0.3, y=0.3),
                max_corner=Point2D(x=0.4, y=0.4),
            ),
        ],
    )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.PerceptionObjectEvent.add_event_batch(session, perception_events)
        result = await orm.PerceptionObjectEvent.get_detection_analytics(
            session,
            DEFAULT_START_TIME,
            DEFAULT_END_TIME,
            camera.mac_address,
            confidence_threshold=ANALYTICS_MIN_CONFIDENCE_THRESHOLD,
            time_interval=DEFAULT_ANALYTICS_TIME_INTERVAL,
        )

        assert len(result) == 50
        assert (result[0].person_count == 10) and (result[0].vehicle_count == 10)
        assert (result[1].person_count == 1) and (result[1].vehicle_count == 0)
        assert (result[2].person_count == 1) and (result[2].vehicle_count == 0)
        assert (result[3].person_count == 0) and (result[3].vehicle_count == 0)
        assert (result[4].person_count == 0) and (result[4].vehicle_count == 0)

        # First detection event should be within the first time interval
        assert (
            abs(result[0].time - DEFAULT_START_TIME)
        ) < DEFAULT_ANALYTICS_TIME_INTERVAL
        # Last detection event should not be within the last time interval
        assert (
            abs(result[-1].time - DEFAULT_START_TIME)
        ) > DEFAULT_ANALYTICS_TIME_INTERVAL


async def test_tracking_analytics_with_same_stack_start_id(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    perception_events = generate_detections(
        mac_address=camera.mac_address,
        detection_generation_configs=[
            DetectionGenerationConfig(
                detection_type=DetectionObjectType.PERSON,
                num_events=10,
                time_gap=timedelta(minutes=0),
                start_track_id=1,
                perception_stack_start_id="0",
                min_corner=Point2D(x=0.3, y=0.3),
                max_corner=Point2D(x=0.4, y=0.4),
            ),
            DetectionGenerationConfig(
                detection_type=DetectionObjectType.PERSON,
                num_events=5,
                start_time=DEFAULT_START_TIME + DEFAULT_ANALYTICS_TIME_INTERVAL,
                time_gap=timedelta(minutes=0),
                start_track_id=1,
                perception_stack_start_id="0",
                min_corner=Point2D(x=0.3, y=0.3),
                max_corner=Point2D(x=0.4, y=0.4),
            ),
        ],
    )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.PerceptionObjectEvent.add_event_batch(session, perception_events)
        tracking_analytics = await orm.PerceptionObjectEvent.get_tracking_analytics(
            session,
            DEFAULT_START_TIME,
            DEFAULT_END_TIME,
            camera.mac_address,
            confidence_threshold=MIN_CONFIDENCE_THRESHOLD,
        )

        assert len(tracking_analytics) == 1
        for item in tracking_analytics:
            if item.object_category == DetectionObjectTypeCategory.PERSON:
                assert item.num_tracks == 10
                assert item.avg_track_duration == DEFAULT_ANALYTICS_TIME_INTERVAL * 0.5
                assert item.max_track_duration == DEFAULT_ANALYTICS_TIME_INTERVAL
            else:
                assert False, "Unexpected object category"


async def test_tracking_analytics_with_different_stack_start_id(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    perception_events = generate_detections(
        mac_address=camera.mac_address,
        detection_generation_configs=[
            DetectionGenerationConfig(
                detection_type=DetectionObjectType.PERSON,
                num_events=10,
                time_gap=timedelta(minutes=0),
                start_track_id=0,
                perception_stack_start_id="0",
                min_corner=Point2D(x=0.3, y=0.3),
                max_corner=Point2D(x=0.4, y=0.4),
            ),
            DetectionGenerationConfig(
                detection_type=DetectionObjectType.PERSON,
                num_events=5,
                start_time=DEFAULT_START_TIME + DEFAULT_ANALYTICS_TIME_INTERVAL,
                time_gap=timedelta(minutes=0),
                start_track_id=0,
                perception_stack_start_id="0",
                min_corner=Point2D(x=0.3, y=0.3),
                max_corner=Point2D(x=0.4, y=0.4),
            ),
            DetectionGenerationConfig(
                detection_type=DetectionObjectType.PERSON,
                num_events=10,
                start_time=DEFAULT_START_TIME + DEFAULT_ANALYTICS_TIME_INTERVAL,
                time_gap=timedelta(minutes=0),
                start_track_id=0,
                perception_stack_start_id="1",
                min_corner=Point2D(x=0.3, y=0.3),
                max_corner=Point2D(x=0.4, y=0.4),
            ),
            DetectionGenerationConfig(
                detection_type=DetectionObjectType.PERSON,
                num_events=5,
                start_time=DEFAULT_START_TIME + DEFAULT_ANALYTICS_TIME_INTERVAL * 3,
                time_gap=timedelta(minutes=0),
                start_track_id=0,
                perception_stack_start_id="1",
                min_corner=Point2D(x=0.3, y=0.3),
                max_corner=Point2D(x=0.4, y=0.4),
            ),
            DetectionGenerationConfig(
                detection_type=DetectionObjectType.CAR,
                num_events=5,
                time_gap=timedelta(minutes=0),
                start_track_id=10,
                perception_stack_start_id="0",
                min_corner=Point2D(x=0.3, y=0.3),
                max_corner=Point2D(x=0.4, y=0.4),
            ),
            DetectionGenerationConfig(
                detection_type=DetectionObjectType.CAR,
                num_events=3,
                start_time=DEFAULT_START_TIME + DEFAULT_ANALYTICS_TIME_INTERVAL,
                time_gap=timedelta(minutes=0),
                start_track_id=10,
                perception_stack_start_id="0",
                min_corner=Point2D(x=0.3, y=0.3),
                max_corner=Point2D(x=0.4, y=0.4),
            ),
        ],
    )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.PerceptionObjectEvent.add_event_batch(session, perception_events)
        tracking_analytics = await orm.PerceptionObjectEvent.get_tracking_analytics(
            session,
            DEFAULT_START_TIME,
            DEFAULT_END_TIME,
            camera.mac_address,
            confidence_threshold=MIN_CONFIDENCE_THRESHOLD,
        )

        assert len(tracking_analytics) == 2
        for item in tracking_analytics:
            if item.object_category == DetectionObjectTypeCategory.PERSON:
                assert item.num_tracks == 20
                assert item.avg_track_duration == DEFAULT_ANALYTICS_TIME_INTERVAL * 0.75
                assert item.max_track_duration == DEFAULT_ANALYTICS_TIME_INTERVAL * 2
            elif item.object_category == DetectionObjectTypeCategory.VEHICLE:
                assert item.num_tracks == 5
                assert item.avg_track_duration == DEFAULT_ANALYTICS_TIME_INTERVAL * 0.6
                assert item.max_track_duration == DEFAULT_ANALYTICS_TIME_INTERVAL
            else:
                assert False, "Unexpected object category"


async def test_aggregate_detections_with_low_confidence(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    """Test that if the detections have too low confidence, we return an empty list."""
    search_rects: list[SearchAreaRectangle | SearchAreaConvexPoly] = [
        SearchAreaRectangle(
            coord_min=Point2D(x=0.0, y=0.0), coord_max=Point2D(x=0.5, y=0.5)
        )
    ]
    perception_events = generate_single_type_detections(
        camera.mac_address,
        DetectionGenerationConfig(
            detection_type=DetectionObjectType.PERSON,
            num_events=10,
            time_gap=DEFAULT_AGGREGATION_TIME_GAP / 20,
            start_track_id=0,
            min_corner=Point2D(x=0.3, y=0.3),
            max_corner=Point2D(x=0.4, y=0.4),
        ),
        confidence=0.4,
    )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.PerceptionObjectEvent.add_event_batch(session, perception_events)
        aggregated = await orm.PerceptionObjectEvent.aggregate_detections(
            session,
            camera.mac_address,
            DEFAULT_START_TIME,
            DEFAULT_END_TIME,
            search_polys=search_rects,
            aggregation_time_gap=DEFAULT_AGGREGATION_TIME_GAP,
            confidence_threshold=0.5,
            min_event_length=MIN_AGGREGATED_EVENT_LENGTH,
        )
    assert aggregated == []


async def test_aggregate_detections_with_mixed_confidence(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    """Test that if the detections have mixed confidence, we return only aggregated
    detections with high confidence."""
    search_rects: list[SearchAreaRectangle | SearchAreaConvexPoly] = [
        SearchAreaRectangle(
            coord_min=Point2D(x=0.0, y=0.0), coord_max=Point2D(x=0.5, y=0.5)
        )
    ]
    perception_events = generate_single_type_detections(
        camera.mac_address,
        DetectionGenerationConfig(
            detection_type=DetectionObjectType.PERSON,
            num_events=10,
            time_gap=DEFAULT_AGGREGATION_TIME_GAP / 20,
            start_track_id=0,
            min_corner=Point2D(x=0.3, y=0.3),
            max_corner=Point2D(x=0.4, y=0.4),
        ),
        confidence=0.4,
    )
    # Replace the detection confidence with a high confidence for last 5 detections
    for perception_event in perception_events[-5:]:
        for detection_object in perception_event.objects or []:
            detection_object.confidence = 0.9

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.PerceptionObjectEvent.add_event_batch(session, perception_events)
        aggregated = await orm.PerceptionObjectEvent.aggregate_detections(
            session,
            camera.mac_address,
            DEFAULT_START_TIME,
            DEFAULT_END_TIME,
            search_polys=search_rects,
            aggregation_time_gap=DEFAULT_AGGREGATION_TIME_GAP,
            confidence_threshold=0.5,
            min_event_length=MIN_AGGREGATED_EVENT_LENGTH,
        )
    assert len(aggregated) == 1
    check_aggregation(
        aggregated[0],
        perception_events[-5].time,
        perception_events[-1].time,
        DetectionObjectTypeCategory.PERSON,
    )


async def test_get_track_ids_in_interval(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    """Test that we can get the track IDs in a time interval."""
    perception_events = generate_detections(
        camera.mac_address,
        [
            # too early
            DetectionGenerationConfig(
                detection_type=DetectionObjectType.PERSON,
                num_events=1,
                time_gap=DEFAULT_AGGREGATION_TIME_GAP / 20,
                start_track_id=0,
                start_time=DEFAULT_START_TIME - DEFAULT_ANALYTICS_TIME_INTERVAL,
                min_corner=Point2D(x=0.3, y=0.3),
                max_corner=Point2D(x=0.4, y=0.4),
            ),
            # in interval
            DetectionGenerationConfig(
                detection_type=DetectionObjectType.PERSON,
                num_events=1,
                time_gap=DEFAULT_AGGREGATION_TIME_GAP / 20,
                start_track_id=1,
                min_corner=Point2D(x=0.3, y=0.3),
                max_corner=Point2D(x=0.4, y=0.4),
            ),
            # too late
            DetectionGenerationConfig(
                detection_type=DetectionObjectType.PERSON,
                num_events=1,
                time_gap=DEFAULT_AGGREGATION_TIME_GAP / 20,
                start_track_id=2,
                start_time=DEFAULT_START_TIME + DEFAULT_ANALYTICS_TIME_INTERVAL,
                min_corner=Point2D(x=0.3, y=0.3),
                max_corner=Point2D(x=0.4, y=0.4),
            ),
        ],
    )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.PerceptionObjectEvent.add_event_batch(session, perception_events)
        track_ids = await orm.PerceptionObjectEvent.get_track_ids_in_interval(
            session,
            camera.mac_address,
            DEFAULT_START_TIME,
            DEFAULT_START_TIME + DEFAULT_ANALYTICS_TIME_INTERVAL / 2,
        )

        assert len(track_ids) == 1
        assert track_ids[0].track_id == 1


async def _generate_motion_detections(
    db_instance: database.Database, camera_mac_address: str, tenant: str
) -> None:
    perception_events = generate_detections(
        mac_address=camera_mac_address,
        detection_generation_configs=[
            DetectionGenerationConfig(
                detection_type=DetectionObjectType.MOTION,
                num_events=11,
                time_gap=timedelta(seconds=0.25),
                start_track_id=0,
                min_corner=Point2D(x=0.3, y=0.3),
                max_corner=Point2D(x=0.4, y=0.4),
            ),
            DetectionGenerationConfig(
                detection_type=DetectionObjectType.MOTION,
                num_events=21,
                time_gap=timedelta(seconds=0.5),
                start_track_id=0,
                start_time=DEFAULT_START_TIME + timedelta(minutes=2),
                min_corner=Point2D(x=0.3, y=0.3),
                max_corner=Point2D(x=0.4, y=0.4),
            ),
        ],
    )
    async with db_instance.tenant_session(tenant=tenant) as session:
        await orm.PerceptionObjectEvent.add_event_batch(session, perception_events)


async def test_simple_activity_count(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    await _generate_motion_detections(
        db_instance, camera.mac_address, organization.tenant
    )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        result = await orm.PerceptionObjectEvent.get_activity_count(
            session=session,
            start_time=DEFAULT_START_TIME,
            end_time=DEFAULT_END_TIME,
            min_event_length=timedelta(seconds=2),
            max_event_time_gap=timedelta(minutes=3),
            aggregation_time_gap=timedelta(seconds=1),
            confidence_threshold=MIN_CONFIDENCE_THRESHOLD,
            object_categories=[DetectionObjectTypeCategory.MOTION],
            camera_data_sources=[
                CameraDataSourceWithROI(
                    mac_address=camera.mac_address, roi_polygon=FULL_SCREEN_ROI
                )
            ],
        )
    # Expect all detections to be aggregated into a single event interval
    assert result.event_count == 1


async def test_activity_count_with_large_event_time_gap(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    await _generate_motion_detections(
        db_instance, camera.mac_address, organization.tenant
    )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        result = await orm.PerceptionObjectEvent.get_activity_count(
            session=session,
            start_time=DEFAULT_START_TIME,
            end_time=DEFAULT_END_TIME,
            min_event_length=timedelta(seconds=2),
            max_event_time_gap=timedelta(minutes=1),
            aggregation_time_gap=timedelta(seconds=1),
            confidence_threshold=MIN_CONFIDENCE_THRESHOLD,
            object_categories=[DetectionObjectTypeCategory.MOTION],
            camera_data_sources=[
                CameraDataSourceWithROI(
                    mac_address=camera.mac_address, roi_polygon=FULL_SCREEN_ROI
                )
            ],
        )
    # Expect all detections to be aggregated into two event intervals
    assert result.event_count == 2


async def test_activity_count_with_short_event_length(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    await _generate_motion_detections(
        db_instance, camera.mac_address, organization.tenant
    )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        result = await orm.PerceptionObjectEvent.get_activity_count(
            session=session,
            start_time=DEFAULT_START_TIME,
            end_time=DEFAULT_END_TIME,
            min_event_length=timedelta(seconds=10),
            max_event_time_gap=timedelta(minutes=1),
            aggregation_time_gap=timedelta(seconds=1),
            confidence_threshold=MIN_CONFIDENCE_THRESHOLD,
            object_categories=[DetectionObjectTypeCategory.MOTION],
            camera_data_sources=[
                CameraDataSourceWithROI(
                    mac_address=camera.mac_address, roi_polygon=FULL_SCREEN_ROI
                )
            ],
        )
    # Expect only the second set of detections to be aggregated
    assert result.event_count == 1


async def test_activity_count_with_sparse_detections(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    await _generate_motion_detections(
        db_instance, camera.mac_address, organization.tenant
    )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        result = await orm.PerceptionObjectEvent.get_activity_count(
            session=session,
            start_time=DEFAULT_START_TIME,
            end_time=DEFAULT_END_TIME,
            min_event_length=timedelta(seconds=10),
            max_event_time_gap=timedelta(minutes=1),
            aggregation_time_gap=timedelta(seconds=0.25),
            confidence_threshold=MIN_CONFIDENCE_THRESHOLD,
            object_categories=[DetectionObjectTypeCategory.MOTION],
            camera_data_sources=[
                CameraDataSourceWithROI(
                    mac_address=camera.mac_address, roi_polygon=FULL_SCREEN_ROI
                )
            ],
        )
    # Expect no detections to be aggregated
    assert result.event_count == 0


async def test_simple_object_count(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.PerceptionObjectEvent.add_event_batch(
            session, _generate_sample_detections(camera)
        )
        result = await orm.PerceptionObjectEvent.get_object_count(
            session,
            DEFAULT_START_TIME,
            DEFAULT_END_TIME,
            confidence_threshold=ANALYTICS_MIN_CONFIDENCE_THRESHOLD,
            object_categories=[DetectionObjectTypeCategory.PERSON],
            camera_data_sources=[
                CameraDataSourceWithROI(
                    mac_address=camera.mac_address, roi_polygon=FULL_SCREEN_ROI
                )
            ],
        )
        assert result.event_count == 13


async def test_simple_object_count_with_zero_min_track_duration(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.PerceptionObjectEvent.add_event_batch(
            session, _generate_sample_detections(camera)
        )
        result = await orm.PerceptionObjectEvent.get_object_count(
            session,
            DEFAULT_START_TIME,
            DEFAULT_END_TIME,
            confidence_threshold=ANALYTICS_MIN_CONFIDENCE_THRESHOLD,
            object_categories=[DetectionObjectTypeCategory.PERSON],
            camera_data_sources=[
                CameraDataSourceWithROI(
                    mac_address=camera.mac_address, roi_polygon=FULL_SCREEN_ROI
                )
            ],
        )
        assert result.event_count == 13


async def test_multiclass_object_count_with_zero_min_track_duration(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.PerceptionObjectEvent.add_event_batch(
            session, _generate_sample_detections(camera)
        )
        result = await orm.PerceptionObjectEvent.get_object_count(
            session,
            DEFAULT_START_TIME,
            DEFAULT_END_TIME,
            confidence_threshold=ANALYTICS_MIN_CONFIDENCE_THRESHOLD,
            object_categories=[
                DetectionObjectTypeCategory.PERSON,
                DetectionObjectTypeCategory.VEHICLE,
            ],
            camera_data_sources=[
                CameraDataSourceWithROI(
                    mac_address=camera.mac_address, roi_polygon=FULL_SCREEN_ROI
                )
            ],
        )
        assert result.event_count == 23


async def test_simple_object_count_over_time(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.PerceptionObjectEvent.add_event_batch(
            session, _generate_sample_detections(camera)
        )
        result = await orm.PerceptionObjectEvent.get_object_count_over_time(
            session,
            DEFAULT_START_TIME,
            DEFAULT_END_TIME,
            confidence_threshold=ANALYTICS_MIN_CONFIDENCE_THRESHOLD,
            time_interval=DEFAULT_ANALYTICS_TIME_INTERVAL,
            object_categories=[
                DetectionObjectTypeCategory.PERSON,
                DetectionObjectTypeCategory.VEHICLE,
            ],
            camera_data_sources=[
                CameraDataSourceWithROI(
                    mac_address=camera.mac_address, roi_polygon=FULL_SCREEN_ROI
                )
            ],
        )

        assert len(result) == 50
        assert result[0].event_count == 10
        assert result[1].event_count == 2
        assert result[2].event_count == 1
        assert result[3].event_count == 1
        assert result[4].event_count == 0

        # First detection event should be within the first time interval
        assert (
            abs(result[0].time - DEFAULT_START_TIME)
        ) < DEFAULT_ANALYTICS_TIME_INTERVAL
        # Last detection event should not be within the last time interval
        assert (
            abs(result[-1].time - DEFAULT_START_TIME)
        ) > DEFAULT_ANALYTICS_TIME_INTERVAL


async def test_simple_line_crossing_detection(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    detections = generate_detections(
        mac_address=camera.mac_address,
        detection_generation_configs=[
            DetectionGenerationConfig(
                detection_type=DetectionObjectType.PERSON,
                num_events=5,
                time_gap=timedelta(seconds=0.2),
                start_track_id=0,
                min_corner=Point2D(x=0.0, y=0.2),
                max_corner=Point2D(x=0.1, y=0.8),
            ),
            DetectionGenerationConfig(
                detection_type=DetectionObjectType.PERSON,
                num_events=3,
                time_gap=timedelta(seconds=0.2),
                start_track_id=0,
                start_time=DEFAULT_START_TIME + timedelta(minutes=1),
                min_corner=Point2D(x=0.9, y=0.2),
                max_corner=Point2D(x=1.0, y=0.8),
            ),
            DetectionGenerationConfig(
                detection_type=DetectionObjectType.PERSON,
                num_events=5,
                time_gap=timedelta(seconds=0.2),
                start_track_id=1,
                start_time=DEFAULT_START_TIME + timedelta(minutes=2),
                min_corner=Point2D(x=0.0, y=0.2),
                max_corner=Point2D(x=0.1, y=0.8),
            ),
        ],
    )
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.PerceptionObjectEvent.add_event_batch(session, detections)

    camera_data_sources = [
        LineCrossingCameraDataSource(
            mac_address=camera.mac_address,
            line=Line2D(
                start_point=Point2D(x=0.5, y=0.0), end_point=Point2D(x=0.5, y=1.0)
            ),
            direction=LineCrossingDirection.LEFT,
        )
    ]

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        result = await orm.PerceptionObjectEvent.get_line_crossing_count(
            session=session,
            camera_data_sources=camera_data_sources,
            start_time=DEFAULT_START_TIME,
            end_time=DEFAULT_END_TIME,
            confidence_threshold=MIN_CONFIDENCE_THRESHOLD,
            object_categories=[DetectionObjectTypeCategory.PERSON],
        )
    assert result.event_count == 3

    camera_data_sources = [
        LineCrossingCameraDataSource(
            mac_address=camera.mac_address,
            line=Line2D(
                start_point=Point2D(x=0.5, y=0.0), end_point=Point2D(x=0.5, y=1.0)
            ),
            direction=LineCrossingDirection.RIGHT,
        )
    ]

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        result = await orm.PerceptionObjectEvent.get_line_crossing_count(
            session=session,
            camera_data_sources=camera_data_sources,
            start_time=DEFAULT_START_TIME,
            end_time=DEFAULT_END_TIME,
            confidence_threshold=MIN_CONFIDENCE_THRESHOLD,
            object_categories=[DetectionObjectTypeCategory.PERSON],
        )
    # Expect all detections to be aggregated into a single event interval
    assert result.event_count == 2
