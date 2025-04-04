import pytest

from backend.database import database
from backend.database.geometry_models import Point2D
from backend.database.models import (
    NVR,
    Camera,
    CameraGroup,
    DetectionObjectType,
    Location,
    PerceptionObject,
    PerceptionObjectCreate,
    SearchAreaConvexPoly,
    SearchAreaRectangle,
)
from backend.database.organization_models import Organization
from backend.perception.models import PerceptionEvent, PerceptionEventsRequest
from backend.perception.utils import (
    _detections_intersection_ratio_sync,
    _detections_polygon_intersection_ratio_sync,
    filter_out_fake_detections,
    filter_perception_events_by_nvr,
)
from backend.test.factory_types import CameraFactory, NVRFactory
from backend.utils import AwareDatetime


def _search_rectangle(
    cx: int = 0, cy: int = 0, width: int = 10, height: int = 10
) -> SearchAreaRectangle:
    return SearchAreaRectangle(
        coord_min=Point2D(x=cx - width / 2, y=cy - height / 2),
        coord_max=Point2D(x=cx + width / 2, y=cy + height / 2),
    )


def _search_polygon(
    cx: int = 0, cy: int = 0, width: int = 10, height: int = 10
) -> SearchAreaConvexPoly:
    return SearchAreaConvexPoly(
        coords=[
            Point2D(x=cx - width / 2, y=cy - height / 2),
            Point2D(x=cx + width / 2, y=cy - height / 2),
            Point2D(x=cx + width / 2, y=cy + height / 2),
            Point2D(x=cx - width / 2, y=cy + height / 2),
        ]
    )


def _invalid_search_polygon(
    cx: int = 0, cy: int = 0, width: int = 10, height: int = 10
) -> SearchAreaConvexPoly:
    # A polygon with self intersection.
    return SearchAreaConvexPoly(
        coords=[
            Point2D(x=cx - width / 2, y=cy - height / 2),
            Point2D(x=cx + width / 2, y=cy - height / 2),
            Point2D(x=cx - width / 2, y=cy + height / 2),
            Point2D(x=cx - width / 2, y=cy - height / 2),
            Point2D(x=cx + width / 2, y=cy + height / 2),
            Point2D(x=cx + width / 2, y=cy - height / 2),
        ]
    )


def _detection_rectangle(
    cx: int = 0, cy: int = 0, width: int = 10, height: int = 10
) -> PerceptionObject:
    coord_min = Point2D(x=cx - width / 2, y=cy - height / 2)
    coord_max = Point2D(x=cx + width / 2, y=cy + height / 2)
    return PerceptionObject(
        object_type=DetectionObjectType.PERSON,
        x_min=coord_min.x,
        y_min=coord_min.y,
        x_max=coord_max.x,
        y_max=coord_max.y,
        time=AwareDatetime.utcnow(),
    )


def test_filter_by_rect_empty() -> None:
    assert _detections_intersection_ratio_sync([], _search_rectangle()) == []


def test_filter_by_polygon_empty() -> None:
    assert _detections_polygon_intersection_ratio_sync([], _search_polygon()) == []


def test_filter_by_rect_overlapping() -> None:
    ratios = _detections_intersection_ratio_sync(
        [_detection_rectangle(), _detection_rectangle()], _search_rectangle()
    )
    assert all([ratio == pytest.approx(1.0) for ratio in ratios])


def test_filter_by_polygon_overlapping() -> None:
    ratios = _detections_polygon_intersection_ratio_sync(
        [_detection_rectangle(), _detection_rectangle()], _search_polygon()
    )
    assert all([ratio.ratio == pytest.approx(1.0) for ratio in ratios])


def test_filter_by_invalid_polygon_overlapping_with_ratio() -> None:
    ratios = _detections_polygon_intersection_ratio_sync(
        [_detection_rectangle(), _detection_rectangle()], _invalid_search_polygon()
    )
    assert all([ratio.ratio == pytest.approx(0.0) for ratio in ratios])


def test_filter_by_rect_disjoint() -> None:
    ratios = _detections_intersection_ratio_sync(
        [
            _detection_rectangle(cx=10, cy=0, width=10, height=10),
            _detection_rectangle(cx=0, cy=10, width=10, height=10),
        ],
        _search_rectangle(),
    )
    assert all([ratio == pytest.approx(0.0) for ratio in ratios])


def test_filter_by_polygon_disjoint() -> None:
    ratios = _detections_polygon_intersection_ratio_sync(
        [
            _detection_rectangle(cx=10, cy=0, width=10, height=10),
            _detection_rectangle(cx=0, cy=10, width=10, height=10),
        ],
        _search_polygon(),
    )
    assert all([ratio.ratio == pytest.approx(0.0) for ratio in ratios])


def test_filter_by_rect_mixed() -> None:
    expected_ratios = [1.0, 0.0, 0.5]
    ratios = _detections_intersection_ratio_sync(
        [
            _detection_rectangle(),
            _detection_rectangle(cx=10, cy=0, width=10, height=10),
            _detection_rectangle(cx=5, cy=0, width=10, height=10),
        ],
        _search_rectangle(),
    )
    assert all(
        [
            ratio == pytest.approx(expected_ratio)
            for ratio, expected_ratio in zip(ratios, expected_ratios)
        ]
    )


def test_filter_by_polygon_mixed() -> None:
    expected_ratios = [1.0, 0.0, 0.5]
    ratios = _detections_polygon_intersection_ratio_sync(
        [
            _detection_rectangle(),
            _detection_rectangle(cx=10, cy=0, width=10, height=10),
            _detection_rectangle(cx=5, cy=0, width=10, height=10),
        ],
        _search_polygon(),
    )
    assert all(
        [
            ratio.ratio == pytest.approx(expected_ratio)
            for ratio, expected_ratio in zip(ratios, expected_ratios)
        ]
    )


def test_filter_by_invalid_polygon_with_ratio() -> None:
    expected_ratios = [0.0, 0.0, 0.0]
    ratios = _detections_polygon_intersection_ratio_sync(
        [
            _detection_rectangle(),
            _detection_rectangle(cx=10, cy=0, width=10, height=10),
            _detection_rectangle(cx=5, cy=0, width=10, height=10),
        ],
        _invalid_search_polygon(),
    )
    assert all(
        [
            ratio.ratio == pytest.approx(expected_ratio)
            for ratio, expected_ratio in zip(ratios, expected_ratios)
        ]
    )


def _generate_events_for_camera(
    camera: Camera, num_perception_events: int = 10, num_detections_per_event: int = 10
) -> list[PerceptionEvent]:
    perception_events = []
    for _ in range(num_perception_events):
        perception_event = PerceptionEvent(
            time=AwareDatetime.utcnow(),
            mac_address=camera.mac_address,
            objects=[
                PerceptionObjectCreate(
                    object_type=DetectionObjectType.PERSON,
                    x_min=0.0,
                    y_min=0.0,
                    x_max=0.0,
                    y_max=0.0,
                    confidence=0.1,
                    is_moving=True,
                    track_id=0,
                    track_age_s=None,
                    object_idx=1,
                    idx_in_frame=None,
                )
                for _ in range(num_detections_per_event)
            ],
        )
        perception_events.append(perception_event)
    return perception_events


async def test_filter_detections_request_by_nvr_all_valid(
    db_instance: database.Database,
    camera_group: CameraGroup,
    nvr: NVR,
    create_camera: CameraFactory,
    organization: Organization,
) -> None:
    camera_1 = await create_camera(camera_group_id=camera_group.id, nvr_uuid=nvr.uuid)
    camera_2 = await create_camera(camera_group_id=camera_group.id, nvr_uuid=nvr.uuid)

    events_1 = _generate_events_for_camera(camera_1)
    events_2 = _generate_events_for_camera(camera_2)

    request = PerceptionEventsRequest(events=events_1 + events_2)
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        request_filtered = await filter_perception_events_by_nvr(
            session, request, nvr.uuid
        )
        assert request_filtered.accepted_events == request.events


async def test_filter_detections_request_request_by_nvr_partial_valid(
    db_instance: database.Database,
    camera_group: CameraGroup,
    nvr: NVR,
    create_camera: CameraFactory,
    location: Location,
    create_nvr: NVRFactory,
    organization: Organization,
) -> None:
    other_nvr = await create_nvr(location_id=location.id)
    camera_1 = await create_camera(camera_group_id=camera_group.id, nvr_uuid=nvr.uuid)
    camera_2 = await create_camera(
        camera_group_id=camera_group.id, nvr_uuid=other_nvr.uuid
    )

    events_1 = _generate_events_for_camera(camera_1)
    events_2 = _generate_events_for_camera(camera_2)

    request = PerceptionEventsRequest(events=events_1 + events_2)
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        request_filtered = await filter_perception_events_by_nvr(
            session, request, nvr.uuid
        )
        assert request_filtered.accepted_events == events_1
        assert request_filtered.rejected_events == events_2
        assert request_filtered.accepted_mac_addresses == {camera_1.mac_address}
        assert request_filtered.rejected_mac_addresses == {camera_2.mac_address}


async def test_filter_detections_request_request_by_nvr_all_invalid(
    db_instance: database.Database,
    camera_group: CameraGroup,
    nvr: NVR,
    create_camera: CameraFactory,
    location: Location,
    create_nvr: NVRFactory,
    organization: Organization,
) -> None:
    other_nvr = await create_nvr(location_id=location.id)
    other_camera = await create_camera(
        camera_group_id=camera_group.id, nvr_uuid=other_nvr.uuid
    )

    events_other = _generate_events_for_camera(other_camera)

    request = PerceptionEventsRequest(events=events_other)
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        request_filtered = await filter_perception_events_by_nvr(
            session, request, nvr.uuid
        )
        assert request_filtered.accepted_events == []


async def test_filter_out_fake_detections(camera: Camera) -> None:
    events = _generate_events_for_camera(camera)
    # add a fake detection to each event
    for event in events:
        assert event.objects is not None
        event.objects.append(
            PerceptionObjectCreate(
                object_type=DetectionObjectType.FAKE_OBJ,
                x_min=0.0,
                y_min=0.0,
                x_max=0.0,
                y_max=0.0,
                confidence=0.1,
                is_moving=True,
                track_id=0,
                track_age_s=None,
                object_idx=1,
                idx_in_frame=None,
            )
        )

    request = PerceptionEventsRequest(events=events)
    filter_out_fake_detections(request)
    for event in events:
        assert event.objects is not None
        assert len(event.objects) > 0
        assert all(
            [obj.object_type != DetectionObjectType.FAKE_OBJ for obj in event.objects]
        )
