from __future__ import annotations

import datetime
import enum
from typing import Any, cast

from pydantic import BaseModel, root_validator, validator

from backend.database import nvr_models
from backend.database.models import (
    Camera,
    UserAlert,
    UserAlertSetting,
    UserAlertTriggerType,
)
from backend.utils import AwareDatetime


class InternetSpeed(BaseModel):
    download_speed_bps: float
    upload_speed_bps: float
    timestamp: AwareDatetime


class InternetStatus(BaseModel):
    # Added None to timestamp to allow for backwards compatibility
    timestamp: AwareDatetime | None = None
    domain: str
    avg_ping_latency_ms: float
    packet_loss: float
    internet_speed: InternetSpeed | None = None


class KvsCheckerResult(str, enum.Enum):
    NO_INTERNET_CONNECTION = "NO_INTERNET_CONNECTION"
    KVS_CONNECTED = "KVS_CONNECTED"
    KVS_DISCONNECTED = "KVS_DISCONNECTED"


class KvsCheckerResultLegacy(enum.Enum):
    NO_INTERNET_CONNECTION = 0
    KVS_CONNECTED = 1
    KVS_DISCONNECTED = 2


class NvrKvsConnectionStatus(BaseModel):
    exception_msg: str | None
    check_result: KvsCheckerResult | None

    @root_validator(pre=True)
    def convert_legacy_check_result(cls, values: Any) -> Any:
        check_result = values.get("check_result")
        if check_result is not None and check_result in [
            result.value for result in KvsCheckerResultLegacy
        ]:
            values["check_result"] = {
                KvsCheckerResultLegacy.NO_INTERNET_CONNECTION.value: (
                    KvsCheckerResult.NO_INTERNET_CONNECTION.value
                ),
                KvsCheckerResultLegacy.KVS_CONNECTED.value: (
                    KvsCheckerResult.KVS_CONNECTED.value
                ),
                KvsCheckerResultLegacy.KVS_DISCONNECTED.value: (
                    KvsCheckerResult.KVS_DISCONNECTED.value
                ),
            }[check_result]

        return values


class NVRResponse(BaseModel):
    id: int
    uuid: str
    location_id: int | None
    last_seen_time: AwareDatetime | None
    is_online: bool
    location_name: str | None
    timezone: str | None
    address: str | None
    address_lat: float | None
    address_lon: float | None
    num_cameras_enabled: int
    num_cameras_disabled: int
    num_available_cameras_slots: int
    max_cameras_slots: int
    org_name: str
    org_tenant: str
    internet_status: InternetStatus | None
    retention_days: int
    nvr_info: nvr_models.NvrInfo | None = None
    # NOTE(@lberg): deprecated, left for backwards compatibility
    name: str | None = None
    kvs_connection_status: NvrKvsConnectionStatus | None = None

    @validator("name", always=True)
    def name_deprecation(cls, _: str | None, values: dict[str, Any]) -> str | None:
        if "uuid" not in values:
            raise ValueError("uuid must be present in NVRResponse")
        return str(values["uuid"])


class CameraGroupWithLocations(BaseModel):
    id: int
    name: str
    is_default: bool
    tenant: str
    location_ids: set[int]


class CameraWithOnlineStatus(Camera):
    is_online: bool


class CameraResponse(BaseModel):
    camera: CameraWithOnlineStatus
    group_name: str
    is_default_group: bool
    location_id: int | None
    location: str | None
    # NOTE(@slava): deprecated, left for backwards compatibility
    nvr_timezone: str | None
    timezone: str | None
    org_name: str
    # NOTE(@lberg): deprecated, left for backwards compatibility
    nvr_name: str | None = None

    @validator("nvr_name", always=True)
    def nvr_name_deprecation(cls, _: str | None, values: dict[str, Any]) -> str | None:
        if "camera" not in values:
            raise ValueError("camera must be present in CameraResponse")
        camera = cast(CameraWithOnlineStatus, values["camera"])
        return camera.nvr_uuid


class PublicCameraData(BaseModel):
    mac_address: str
    name: str
    # NOTE(@slava): deprecated, left for backwards compatibility
    nvr_timezone: str | None
    timezone: str | None
    is_enabled: bool
    is_online: bool
    is_webrtc_enabled: bool

    @staticmethod
    def from_camera_response(camera_response: CameraResponse) -> PublicCameraData:
        return PublicCameraData(
            mac_address=camera_response.camera.mac_address,
            name=camera_response.camera.name,
            nvr_timezone=camera_response.nvr_timezone,
            timezone=camera_response.timezone,
            is_enabled=camera_response.camera.is_enabled,
            is_online=camera_response.camera.is_online,
            is_webrtc_enabled=camera_response.camera.is_webrtc_enabled,
        )


class UserAlertWithStreamName(BaseModel):
    user_alert: UserAlert
    mac_address: str | None
    stream_name: str | None
    camera_name: str | None
    location_name: str | None
    group_name: str | None
    email: str | None
    phone: str | None
    tenant: str

    @staticmethod
    def clip_start_time(alert: UserAlert) -> AwareDatetime:
        # Set the clip start time to be 5 seconds before the alert start time
        clip_start_time: AwareDatetime = alert.start_time - datetime.timedelta(
            seconds=5
        )

        return clip_start_time

    @staticmethod
    def clip_end_time(alert: UserAlert) -> AwareDatetime:
        # Set it to 3 minute after the alert start time s.t. each retry
        # will use the same clip end time.
        max_clip_end_time: AwareDatetime = alert.start_time + datetime.timedelta(
            minutes=5
        )

        # TODO: update clip_end_time to be the dynamic end time once we
        # have figured out how to finish clip request in one alert checking
        # cycle.
        clip_end_time: AwareDatetime = max_clip_end_time
        return clip_end_time


class UserAlertSettingResponse(BaseModel):
    setting: UserAlertSetting
    trigger_type: UserAlertTriggerType | None


class TextSearchResponseMessageBase(BaseModel):
    timestamp: AwareDatetime
    score: float
    mac_address: str
    object_id: int


# TODO(@lberg): remove once endpoints are deleted and mobile app is updated
class TextSearchResponseMessage(TextSearchResponseMessageBase):
    # This is used for backend to frontend communication
    camera: CameraResponse


class CameraGroupRestriction(BaseModel):
    location_id: int
    camera_group_id: int


class AccessRestrictions(BaseModel):
    full_access: bool = True
    # Gives full access to a location
    location_ids: list[int] = []
    # Gives access to a group within a location
    camera_groups: list[CameraGroupRestriction] = []


class JourneyResponseMessageBase(BaseModel):
    timestamp: AwareDatetime
    mac_address: str
    object_idx: int
    score: float


class EventsIngestionResponse(BaseModel):
    num_events_received: int
    num_events_ingested: int

    @property
    def num_events_dropped(self) -> int:
        return self.num_events_received - self.num_events_ingested
