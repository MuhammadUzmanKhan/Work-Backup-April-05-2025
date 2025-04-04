from abc import ABC, abstractmethod
from enum import Enum, auto
from typing import Any

import pydantic

from backend.models import CameraResponse
from backend.monitor.alert_types import AlertType, CameraPipelineAlertType
from backend.monitor.models import (
    CameraResponseWithAlertStates,
    NVRResponseWithAlertStates,
)
from backend.utils import AwareDatetime


class EdgeAlertSeverity(str, Enum):
    CRITICAL = auto()
    ERROR = auto()
    WARNING = auto()
    INFO = auto()


class EdgeAlertData(pydantic.BaseModel):
    time_generated: AwareDatetime
    alert_info: dict[str, str]
    # Service that generated the alert
    alert_source: str
    alert_severity: EdgeAlertSeverity


class CameraAlertData(pydantic.BaseModel):
    data: EdgeAlertData
    camera_mac_address: str


class NvrAlertData(pydantic.BaseModel):
    data: EdgeAlertData


class EdgeCameraAlertRequest(pydantic.BaseModel):
    alert_data: CameraAlertData | NvrAlertData

    @pydantic.root_validator(pre=True)
    def backward_compatible_validate(cls, values: dict[str, Any]) -> dict[str, Any]:
        if "time_generated" not in values:
            return values

        # Backward compatibility for old alert data
        data = EdgeAlertData(
            time_generated=values["time_generated"],
            alert_info=values["alert_info"],
            alert_source=values["alert_source"],
            alert_severity=values.get("alert_severity", EdgeAlertSeverity.WARNING),
        )

        if values.get("camera_mac_address", None) is not None:
            return {
                "alert_data": CameraAlertData(
                    camera_mac_address=values["camera_mac_address"], data=data
                )
            }
        else:
            return {"alert_data": NvrAlertData(data=data)}


class AlertSeverity(str, Enum):
    CRITICAL = auto()
    ERROR = auto()
    WARNING = auto()
    INFO = auto()

    @staticmethod
    def from_edge_alert_severity(edge_severity: EdgeAlertSeverity) -> "AlertSeverity":
        return {
            EdgeAlertSeverity.CRITICAL: AlertSeverity.CRITICAL,
            EdgeAlertSeverity.ERROR: AlertSeverity.ERROR,
            EdgeAlertSeverity.WARNING: AlertSeverity.WARNING,
            EdgeAlertSeverity.INFO: AlertSeverity.INFO,
        }[edge_severity]


class Alert(pydantic.BaseModel, ABC):
    alert_type: AlertType | CameraPipelineAlertType
    alert_severity: AlertSeverity
    timestamp: AwareDatetime = pydantic.Field(
        default_factory=lambda: AwareDatetime.utcnow()
    )
    detailed_info: dict[str, str] = pydantic.Field(default_factory=dict)


class AlertGrouped(Alert):
    @property
    @abstractmethod
    def group_msg_info(self) -> dict[str, str]: ...

    @abstractmethod
    def get_alert_group_text(self) -> str:
        """This returns the text we'll put in the group alert message. This text
        will be later used to find the group message in the channel, so we can
        add new messages to it."""
        ...


class AlertOrgGrouped(AlertGrouped):
    org_name: str

    @property
    def group_msg_info(self) -> dict[str, str]:
        return {"organization": self.org_name}

    def get_alert_group_text(self) -> str:
        return f"Backend alert: {self.alert_type} for org {self.org_name}."


class AlertTypeGrouped(AlertGrouped):
    @property
    def group_msg_info(self) -> dict[str, str]:
        return {"alert_type": self.alert_type}

    def get_alert_group_text(self) -> str:
        return f"Backend alert grouped on type: {self.alert_type}."


class AlertNVR(AlertGrouped):
    # The UUID of the NVR that caused the alert
    nvr_uuid: str
    org_name: str

    @property
    def group_msg_info(self) -> dict[str, str]:
        return {"organization": self.org_name, "nvr_uuid": self.nvr_uuid}

    def get_alert_group_text(self) -> str:
        return f"Backend alert: {self.alert_type} for NVR {self.nvr_uuid}."

    @staticmethod
    def from_cameras(
        cameras_to_alert_one_nvr: list[CameraResponseWithAlertStates], nvr_uuid: str
    ) -> "AlertNVR":
        if not cameras_to_alert_one_nvr:
            raise ValueError("cameras_to_alert_one_nvr is empty")

        return AlertNVR(
            alert_type=(
                AlertType.CAMERA_DOWN
                if not cameras_to_alert_one_nvr[0].camera.is_online
                else AlertType.CAMERA_UP
            ),
            alert_severity=AlertSeverity.INFO,
            nvr_uuid=nvr_uuid,
            org_name=cameras_to_alert_one_nvr[0].org_name,
            detailed_info={
                "cameras_down": ", ".join(
                    [
                        camera.camera.name + f" ({camera.camera.mac_address})"
                        for camera in cameras_to_alert_one_nvr
                        if not camera.camera.is_online
                    ]
                ),
                "cameras_up": ", ".join(
                    [
                        camera.camera.name + f" ({camera.camera.mac_address})"
                        for camera in cameras_to_alert_one_nvr
                        if camera.camera.is_online
                    ]
                ),
                "time_generated": AwareDatetime.utcnow().isoformat(),
            },
        )

    @staticmethod
    def from_nvr(nvr: NVRResponseWithAlertStates) -> "AlertNVR":
        return AlertNVR(
            alert_type=(
                AlertType.NVR_DOWN
                if not nvr.is_online
                else (
                    AlertType.MOST_CAMERAS_DOWN
                    if nvr.too_many_cameras_offline
                    else AlertType.NVR_UP
                )
            ),
            alert_severity=AlertSeverity.INFO,
            nvr_uuid=nvr.uuid,
            org_name=nvr.org_name,
            detailed_info={
                "uuid": nvr.uuid,
                "last_seen": (
                    nvr.last_seen_time.isoformat()
                    if nvr.last_seen_time is not None
                    else "N/A"
                ),
                "location_name": nvr.location_name,
                "organization": nvr.org_name,
                "num_cameras_enabled": nvr.num_cameras_enabled,
                "num_cameras_disabled": nvr.num_cameras_disabled,
                "num_cameras_online": nvr.num_cameras_online,
            },
        )

    @staticmethod
    def from_edge_nvr_alert(
        nvr_alert: NvrAlertData, nvr_uuid: str, org_name: str
    ) -> "AlertNVR":
        return AlertNVR(
            alert_type=AlertType.EDGE_NVR_ALERT,
            alert_severity=AlertSeverity.from_edge_alert_severity(
                nvr_alert.data.alert_severity
            ),
            nvr_uuid=nvr_uuid,
            org_name=org_name,
            detailed_info=nvr_alert.data.alert_info
            | {
                "alert_source": nvr_alert.data.alert_source,
                "organization": org_name,
                "nvr_uuid": nvr_uuid,
                "time_generated": nvr_alert.data.time_generated.isoformat(),
            },
        )

    @staticmethod
    def from_edge_camera_alert(
        camera_alert: CameraAlertData, camera_response: CameraResponse
    ) -> "AlertNVR":
        return AlertNVR(
            alert_type=AlertType.EDGE_CAMERA_ALERT,
            alert_severity=AlertSeverity.from_edge_alert_severity(
                camera_alert.data.alert_severity
            ),
            nvr_uuid=camera_response.camera.nvr_uuid,
            org_name=camera_response.org_name,
            detailed_info=camera_alert.data.alert_info
            | {
                "alert_source": camera_alert.data.alert_source,
                "organization": camera_response.org_name,
                "nvr_uuid": camera_response.camera.nvr_uuid,
                "mac_address": camera_alert.camera_mac_address,
                "time_generated": camera_alert.data.time_generated.isoformat(),
            },
        )
