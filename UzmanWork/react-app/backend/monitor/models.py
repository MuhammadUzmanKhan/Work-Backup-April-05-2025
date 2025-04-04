import enum
from typing import Annotated, Literal, Union

import pydantic
from fastapi import Body

from backend.database import nvr_models
from backend.kinesis_api.models import KinesisVideoClipRequest, KinesisVideoLiveRequest
from backend.models import (
    CameraResponse,
    InternetStatus,
    NvrKvsConnectionStatus,
    NVRResponse,
)
from backend.monitor.alert_types import CameraPipelineAlertType, EdgeStatusUpdateType
from backend.utils import AwareDatetime, validate_timezone


class VideoType(str, enum.Enum):
    LIVE = "LIVE"
    CLIP = "CLIP"


class HeartbeatSource(str, enum.Enum):
    PRODUCER = "PRODUCER"
    LOGGER = "LOGGER"


class VideoAlertLive(pydantic.BaseModel):
    video_type: Literal[VideoType.LIVE] = VideoType.LIVE
    live_request: KinesisVideoLiveRequest
    mac_address: str

    def to_alert_detailed_info(self) -> dict[str, str]:
        return {
            "mac_address": self.mac_address,
            "resolution_config": self.live_request.resolution_config.static_resolution,
            "prefer_webrtc": str(self.live_request.prefer_webrtc),
        }


class VideoAlertClip(pydantic.BaseModel):
    video_type: Literal[VideoType.CLIP] = VideoType.CLIP
    clip_request: KinesisVideoClipRequest
    mac_address: str

    def to_alert_detailed_info(self) -> dict[str, str]:
        return {
            "start_time": self.clip_request.start_time.isoformat(),
            "end_time": self.clip_request.end_time.isoformat(),
            "mac_address": self.mac_address,
        }


VideoAlertRequest = Annotated[
    Union[VideoAlertLive, VideoAlertClip], Body(discriminator="video_type")
]


class CameraPipelineAlert(pydantic.BaseModel):
    alert_type: CameraPipelineAlertType
    time_generated: AwareDatetime
    camera_mac_address: str
    # Service that generated the alert
    alert_source: str
    # Detailed information about the alert
    alert_details: str


class CameraPipelineAlertRequest(CameraPipelineAlert):
    pass


class CameraPipelineAlertCreate(CameraPipelineAlert):
    # The UUID of the NVR that caused the alert
    nvr_uuid: str


class EdgeStatusUpdate(pydantic.BaseModel):
    type: EdgeStatusUpdateType
    time_generated: AwareDatetime
    # Service that generated the update
    source: str
    # Detailed information about the update
    details: str


class EdgeStatusUpdateRequest(EdgeStatusUpdate):
    pass


class EdgeStatusUpdateCreate(EdgeStatusUpdate):
    # The UUID of the NVR that caused the update
    nvr_uuid: str


class CameraStreamDetails(pydantic.BaseModel):
    width: int
    height: int
    fps: float
    bitrate_kbps: float
    codec: str
    mac_address: str
    rtsp_url: str


class CameraHeartbeat(pydantic.BaseModel):
    # The MAC addresses of the cameras that are online and sending the heartbeat
    camera_mac_addresses: list[str]
    # Time of the heartbeat
    timestamp: AwareDatetime

    # # Validate that items in camera_mac_addresses are unique
    @pydantic.validator("camera_mac_addresses")
    def validate_camera_mac_addresses(
        cls, camera_mac_addresses: list[str]
    ) -> list[str] | None:
        if len(camera_mac_addresses) != len(set(camera_mac_addresses)):
            raise ValueError("camera_mac_addresses must be unique")
        else:
            return camera_mac_addresses


class CameraHeartbeatBatchRequest(pydantic.BaseModel):
    # Batch of camera heartbeats to be sent to the backend
    batch_heartbeats: list[CameraHeartbeat] = pydantic.Field(default=[], max_items=360)


class NvrNetworkInfoUpdate(nvr_models.NvrNetworkInfo):
    network_interfaces: list[nvr_models.NvrNetworkInterface] = pydantic.Field(
        default=[], max_items=8
    )


class NvrInfoUpdate(nvr_models.NvrInfo):
    network_info: NvrNetworkInfoUpdate


class NvrKvsConnectionStatusUpdate(NvrKvsConnectionStatus):
    pass


class HeartbeatRequest(pydantic.BaseModel):
    camera_mac_addresses: set[str] | None = pydantic.Field(max_items=100)
    camera_stream_details: list[CameraStreamDetails] | None = pydantic.Field(
        max_items=100
    )
    message_source: HeartbeatSource
    nvr_uuid: str
    nvr_info: NvrInfoUpdate | None = None
    nvr_kvs_connection_status: NvrKvsConnectionStatusUpdate | None = None
    camera_heartbeats: CameraHeartbeatBatchRequest | None = None


class TimezoneUpdate(pydantic.BaseModel):
    nvr_uuid: str
    timezone: str

    @pydantic.validator("timezone", pre=True)
    def validate_timezone(cls, timezone_str: str) -> str:
        return validate_timezone(timezone_str)


class PgCronData(pydantic.BaseModel):
    class PgCronDataStatus(str, enum.Enum):
        SUCCESS = "succeeded"
        FAILURE = "failed"

    start_time: AwareDatetime
    command: str
    status: PgCronDataStatus
    return_message: str


class CameraAlertOnlineStatus(pydantic.BaseModel):
    online_status_when_last_alerted: bool


class NvrAlertOnlineStatus(pydantic.BaseModel):
    online_status_when_last_alerted: bool
    too_many_cameras_offline_when_last_alerted: bool


class InternetStatusRequest(InternetStatus):
    nvr_uuid: str


class NVRResponseWithAlertStates(NVRResponse):
    """NVRResponse with additional attributes to keep track of alert state."""

    last_alert_time: AwareDatetime | None = None
    online_status_when_last_alerted: bool | None = None
    num_cameras_online: int
    too_many_cameras_offline: bool
    too_many_cameras_offline_when_last_alerted: bool | None = None

    @staticmethod
    def from_nvr_response(
        nvr_response: NVRResponse,
        last_alert_time: AwareDatetime | None,
        online_status_when_last_alerted: bool | None,
        num_cameras_online: int,
        min_enabled_cameras_down_ratio_to_alert: float,
        too_many_cameras_offline_when_last_alerted: bool | None,
    ) -> "NVRResponseWithAlertStates":
        too_many_cameras_offline = nvr_response.num_cameras_enabled > 0 and (
            (nvr_response.num_cameras_enabled - num_cameras_online)
            >= nvr_response.num_cameras_enabled
            * min_enabled_cameras_down_ratio_to_alert
        )
        return NVRResponseWithAlertStates(
            **nvr_response.dict(),
            **{
                "last_alert_time": last_alert_time,
                "online_status_when_last_alerted": online_status_when_last_alerted,
                "num_cameras_online": num_cameras_online,
                "too_many_cameras_offline": too_many_cameras_offline,
                "too_many_cameras_offline_when_last_alerted": (
                    too_many_cameras_offline_when_last_alerted
                ),
            },
        )


class CameraResponseWithAlertStates(CameraResponse):
    """CameraResponse with additional attributes to keep track of alert state."""

    last_alert_time: AwareDatetime | None = None
    online_status_when_last_alerted: bool | None = None

    @staticmethod
    def from_camera_response(
        camera_response: CameraResponse,
        last_alert_time: AwareDatetime | None,
        online_status_when_last_alerted: bool | None,
    ) -> "CameraResponseWithAlertStates":
        return CameraResponseWithAlertStates(
            **camera_response.dict(),
            **{
                "last_alert_time": last_alert_time,
                "online_status_when_last_alerted": online_status_when_last_alerted,
            },
        )


class NvrsToAlertResult(pydantic.BaseModel):
    all_nvrs: list[NVRResponseWithAlertStates]
    # Key is org tenant
    nvrs_with_status_change: list[NVRResponseWithAlertStates]
    # Key is org tenant
    nvrs_with_overdue_alerts: list[NVRResponseWithAlertStates]


class CamerasToAlertResult(pydantic.BaseModel):
    # Key is org tenant
    cameras_with_status_change: list[CameraResponseWithAlertStates]
    # Key is org tenant
    cameras_with_overdue_alerts: list[CameraResponseWithAlertStates]
