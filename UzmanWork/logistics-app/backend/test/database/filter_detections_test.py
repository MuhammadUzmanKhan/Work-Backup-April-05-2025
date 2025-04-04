import datetime
from dataclasses import dataclass
from typing import List

import pytest

from backend.database import database, orm
from backend.database.models import (
    Camera,
    DetectionObjectType,
    PerceptionObject,
    PerceptionObjectCreate,
)
from backend.database.organization_models import Organization
from backend.perception.models import PerceptionEvent
from backend.test.database.conftest import DEFAULT_START_TIME, DetectionParams
from backend.utils import AwareDatetime


# Class describing detection query result entries.
@dataclass(frozen=True)
class FilteredDetectionResult:
    object_type: DetectionObjectType
    time: AwareDatetime
    is_moving: bool

    def __eq__(self, __value: object) -> bool:
        if not isinstance(__value, FilteredDetectionResult) and not isinstance(
            __value, PerceptionObject
        ):
            return NotImplemented
        return self.object_type == __value.object_type and self.time == __value.time


async def test_new_perception_event(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    mac_address = camera.mac_address
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        perception_event = PerceptionEvent(
            time=DEFAULT_START_TIME,
            mac_address=mac_address,
            perception_stack_start_id="--",
            objects=[
                PerceptionObjectCreate(
                    object_type=DetectionObjectType.PERSON,
                    x_min=0,
                    y_min=0,
                    x_max=0,
                    y_max=0,
                    confidence=0,
                    is_moving=False,
                    track_id=0,
                    track_age_s=0,
                    object_idx=1,
                    idx_in_frame=None,
                )
            ],
        )

        await orm.PerceptionObjectEvent.add_event_batch(session, [perception_event])

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        pcp_objects = await orm.PerceptionObjectEvent.filter_detections(
            session,
            mac_address=mac_address,
            detection_classes={DetectionObjectType.PERSON},
        )

    assert len(pcp_objects) == 1


# TODO: refactor this to not use parametrize.
@pytest.mark.parametrize(
    (
        "time, detection_params,"
        " query_start_time, query_end_time,"
        " expected_detection_results"
    ),
    [
        (
            DEFAULT_START_TIME,
            [],
            DEFAULT_START_TIME,
            DEFAULT_START_TIME + datetime.timedelta(hours=1),
            [],
        ),
        (
            DEFAULT_START_TIME,
            [DetectionParams(DetectionObjectType.PERSON, 0, 0, 0, 0, 0, False, 0)],
            DEFAULT_START_TIME,
            DEFAULT_START_TIME + datetime.timedelta(hours=1),
            [
                FilteredDetectionResult(
                    DetectionObjectType.PERSON, DEFAULT_START_TIME, False
                )
            ],
        ),
        (
            DEFAULT_START_TIME + datetime.timedelta(hours=1),
            [
                DetectionParams(DetectionObjectType.PERSON, 0, 0, 0, 0, 0, False, 0),
                DetectionParams(DetectionObjectType.CAR, 0, 0, 0, 0, 0, True, 0),
            ],
            DEFAULT_START_TIME,
            DEFAULT_START_TIME + datetime.timedelta(hours=1),
            [
                FilteredDetectionResult(
                    DetectionObjectType.PERSON,
                    DEFAULT_START_TIME + datetime.timedelta(hours=1),
                    False,
                ),
                FilteredDetectionResult(
                    DetectionObjectType.CAR,
                    DEFAULT_START_TIME + datetime.timedelta(hours=1),
                    True,
                ),
            ],
        ),
        (
            DEFAULT_START_TIME,
            [DetectionParams(DetectionObjectType.PERSON, 0, 0, 0, 0, 0, False, 0)],
            DEFAULT_START_TIME + datetime.timedelta(hours=1.1),
            DEFAULT_START_TIME + datetime.timedelta(hours=2.1),
            [],
        ),
    ],
)
async def test_filter_detections(
    db_instance: database.Database,
    camera: Camera,
    organization: Organization,
    detection_events: None,
    query_start_time: AwareDatetime,
    query_end_time: AwareDatetime,
    expected_detection_results: List[FilteredDetectionResult],
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        filtered_detections = await orm.PerceptionObjectEvent.filter_detections(
            session,
            camera.mac_address,
            {DetectionObjectType.CAR, DetectionObjectType.PERSON},
            query_start_time,
            query_end_time,
        )

    for expected_detection_result in expected_detection_results:
        assert any(
            expected_detection_result == detection_result
            for detection_result in filtered_detections
        ), f"Expected {expected_detection_result} not found in {filtered_detections}"
