from ipaddress import IPv4Address
from typing import Literal

from pydantic import BaseModel, Field

from backend.constants import REGEX_MAC_ADDRESS
from backend.database.models import CameraCreate, VideoOrientationType


class CandidateCameraData(BaseModel):
    nvr_uuids: set[str]
    mac_address: str = Field(regex=REGEX_MAC_ADDRESS)
    vendor: str
    ip: IPv4Address
    username: str | None
    password: str | None
    # TODO(@lberg): remove optional after nvrs are updated
    rtsp_port: int = 0

    def __hash__(self) -> int:
        return hash(self.mac_address)


class CandidateNvrData(BaseModel):
    uuid: str
    num_available_slots: int


class CandidateCamerasResponse(BaseModel):
    candidate_cameras_data: list[CandidateCameraData]
    candidate_nvrs_data: list[CandidateNvrData]
    unavailable_nvr_uuids: set[str]


class RegisterCandidateCamerasRequest(BaseModel):
    candidate_cameras_data: list[CandidateCameraData]


class CameraAssignmentOK(BaseModel):
    outcome_type: Literal["OK"] = "OK"
    camera_data: CandidateCameraData
    nvr_uuid: str

    def get_camera_create(
        self, is_audio_enabled: bool, is_webrtc_enabled: bool
    ) -> CameraCreate:
        return CameraCreate(
            mac_address=self.camera_data.mac_address,
            nvr_uuid=self.nvr_uuid,
            is_enabled=True,
            vendor=self.camera_data.vendor,
            ip=str(self.camera_data.ip),
            video_orientation_type=VideoOrientationType.OrientationIdentity,
            is_always_streaming=False,
            is_license_plate_detection_enabled=False,
            is_audio_enabled=is_audio_enabled,
            is_faulty=False,
            is_webrtc_enabled=is_webrtc_enabled,
            is_force_fps_enabled=False,
            username=self.camera_data.username,
            password=self.camera_data.password,
            rtsp_port=self.camera_data.rtsp_port,
            enforced_rtsp_url=None,
        )


class CameraAssignmentError(BaseModel):
    outcome_type: Literal["ERROR"] = "ERROR"
    camera_data: CandidateCameraData
    error: str


class RegisterCandidateCamerasResponse(BaseModel):
    successful_assignments: list[CameraAssignmentOK]
    failed_assignments: list[CameraAssignmentError]
