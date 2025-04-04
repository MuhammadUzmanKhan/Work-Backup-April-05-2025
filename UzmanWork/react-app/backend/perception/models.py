from __future__ import annotations

from datetime import timedelta

from pydantic import BaseModel, Field

from backend.constants import UNKNOWN_PERCEPTION_STACK_START_ID
from backend.database.models import (
    DetectionObjectType,
    DetectionObjectTypeCategory,
    PerceptionObjectCreate,
    SearchAreaConvexPoly,
    SearchAreaRectangle,
    TriggerType,
)
from backend.utils import AwareDatetime


class AlertDetectionsInterval(BaseModel):
    start_time: AwareDatetime
    end_time: AwareDatetime
    alert_setting_id: int
    alert_trigger_type: TriggerType
    camera_mac_address: str
    tenant: str

    class Config:
        orm_mode = True


class DetectionInterval(BaseModel):
    start_time: AwareDatetime
    end_time: AwareDatetime
    detection_type: DetectionObjectType


class AggregationInterval(BaseModel):
    start_time: AwareDatetime
    end_time: AwareDatetime
    object_category: DetectionObjectTypeCategory

    class Config:
        orm_mode = True


class DashboardEventCount(BaseModel):
    event_count: int

    class Config:
        orm_mode = True


class DashboardTimeBasedEventCount(BaseModel):
    event_count: int
    time: AwareDatetime

    class Config:
        orm_mode = True


class DashboardEventInterval(BaseModel):
    start_time: AwareDatetime
    end_time: AwareDatetime
    mac_address: str
    object_category: DetectionObjectTypeCategory

    class Config:
        orm_mode = True


class DetectionAnalyticsInterval(BaseModel):
    time: AwareDatetime
    person_count: int
    vehicle_count: int

    class Config:
        orm_mode = True


class TrackingAnalyticsInterval(BaseModel):
    object_category: DetectionObjectTypeCategory
    num_tracks: int
    avg_track_duration: timedelta
    max_track_duration: timedelta

    class Config:
        orm_mode = True


class AnalyticsResponse(BaseModel):
    detection_analytics: list[DetectionAnalyticsInterval]
    tracking_analytics: list[TrackingAnalyticsInterval]


class TimedIntersectionRatio(BaseModel):
    time: AwareDatetime
    ratio: float


# Request for aggregated detections
class DetectionAggregatedRequest(BaseModel):
    # List of polys we use in filter, if empty the whole image will be searched
    search_polys: list[SearchAreaConvexPoly | SearchAreaRectangle]
    # Start time for the filter
    start_time: AwareDatetime
    # End time for the filter
    end_time: AwareDatetime
    # If True we will return only the detections that are moving
    moving_detections_only: bool = True
    # Minimum aggregated event length in seconds
    min_event_length: timedelta | None


class DetectionAnalyticsRequest(BaseModel):
    # Start time for the filter
    start_time: AwareDatetime
    # End time for the filter
    end_time: AwareDatetime
    # Mac address for the requested camera
    mac_address: str
    # If True we will return only the detections that are moving
    moving_detections_only: bool = False
    # List of polys we use in filter, if empty the whole image will be searched
    search_polys: list[SearchAreaConvexPoly | SearchAreaRectangle]
    # Minimum confidence threshold for filtering detections
    confidence_threshold: float | None
    # Minimum track duration to be considered
    min_track_duration: timedelta | None


class PerceptionEvent(BaseModel):
    time: AwareDatetime
    mac_address: str
    perception_stack_start_id: str = UNKNOWN_PERCEPTION_STACK_START_ID
    # TODO(@lberg): remove None after VAS-2119 is resolved
    objects: list[PerceptionObjectCreate] | None = None


class PerceptionEventsRequest(BaseModel):
    events: list[PerceptionEvent] = Field(max_items=2000)


class FilteredPerceptionsEvents(BaseModel):
    accepted_events: list[PerceptionEvent]
    rejected_events: list[PerceptionEvent]
    accepted_mac_addresses: set[str]
    rejected_mac_addresses: set[str]
