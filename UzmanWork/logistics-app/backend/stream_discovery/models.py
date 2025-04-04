from enum import Enum
from ipaddress import IPv4Address
from typing import Callable

from pydantic import BaseModel, Field, validator

from backend.constants import DEFAULT_MAX_NUM_CAMERA_SLOTS_NVR, REGEX_MAC_ADDRESS
from backend.database.models import VideoOrientationType
from backend.database.network_scan_models import NetworkScanAuto, NetworkScanSettings
from backend.stream_discovery.constants import CACHE_CAMERA_STALE_TIME
from backend.utils import AwareDatetime


class NvrGpu(str, Enum):
    Unknown = "Unknown"
    T1000 = "T1000"
    A2000 = "A2000"
    A4500 = "A4500"


class NvrCapabilities(BaseModel):
    gpu: NvrGpu = NvrGpu.Unknown

    def max_num_cameras(self) -> int:
        """Get the maximum number of cameras supported by the NVR
        based on its capabilities.
        Currently this is based on the GPU only.

        :return: maximum number of cameras supported by the NVR
        """
        if self.gpu == NvrGpu.T1000:
            return 16
        elif self.gpu == NvrGpu.A2000:
            return 24
        elif self.gpu == NvrGpu.A4500:
            return 64
        else:
            # TODO(@lberg): there are different choices here:
            # - Use the max number of cameras for the most powerful NVR
            # - Use the max number of cameras for the least powerful NVR
            # - Don't set a limit
            return DEFAULT_MAX_NUM_CAMERA_SLOTS_NVR


class DiscoveredCamera(BaseModel):
    streaming_codec: str
    mac_address: str = Field(regex=REGEX_MAC_ADDRESS)
    vendor: str
    ip: IPv4Address
    # TODO(@lberg): remove optional after nvrs are updated
    rtsp_port: int = 0


class DiscoveryRequest(BaseModel):
    nvr_uuid: str
    cameras: list[DiscoveredCamera] = Field(max_items=4096)
    # Capabilities of the NVR in terms of hardware
    nvr_capabilities: NvrCapabilities
    # time of the discovery
    discovery_time: AwareDatetime = Field(default_factory=AwareDatetime.utcnow)

    @validator("cameras")
    def validate_cameras(
        cls, cameras: list[DiscoveredCamera]
    ) -> list[DiscoveredCamera]:
        mac_addresses = [camera.mac_address for camera in cameras]
        if len(mac_addresses) != len(set(mac_addresses)):
            raise ValueError("Duplicate mac addresses")
        return cameras

    def mac_address_to_camera(self) -> dict[str, DiscoveredCamera]:
        """Returns a dict mapping mac addresses to cameras.

        :return: a dict mapping mac addresses to cameras
        """
        return {camera.mac_address: camera for camera in self.cameras}


class CameraDiscoveryResponse(BaseModel):
    mac_address: str = Field(regex=REGEX_MAC_ADDRESS)
    username: str | None
    password: str | None
    vendor: str
    ip: IPv4Address
    video_orientation_type: VideoOrientationType
    is_always_streaming: bool
    is_license_plate_detection_enabled: bool
    is_audio_enabled: bool
    # 0 means the FPS is not forced
    force_video_config_fps: int | None
    stream_hash: str
    rtsp_port: int
    enforced_rtsp_url: str | None

    # Validate that force_video_config_fps is positive or None
    @validator("force_video_config_fps")
    def validate_force_video_config_fps(cls, force_video_config_fps: int) -> int | None:
        if force_video_config_fps is not None and force_video_config_fps <= 0:
            raise ValueError("force_video_config_fps must be positive or None")
        return force_video_config_fps


class NvrStatusResponse(BaseModel):
    mac_addresses_disabled: list[str]
    cameras_enabled: list[CameraDiscoveryResponse]
    is_face_recognition_enabled: bool = False
    retention_days: int
    low_res_bitrate_kbps: int
    network_scan_settings: NetworkScanSettings = NetworkScanAuto()


# This represents a camera cached at a certain time
class DiscoveryCachedCamera(BaseModel):
    camera: DiscoveredCamera
    cached_at: AwareDatetime


# This represents a discovery cached at a certain time
class DiscoveryCachedEntry(BaseModel):
    nvr_uuid: str
    cached_cameras: dict[str, DiscoveryCachedCamera]
    last_discovery_time: AwareDatetime

    def get_cameras(self) -> list[DiscoveredCamera]:
        return [camera.camera for camera in self.cached_cameras.values()]

    @staticmethod
    def from_discovery(discovery: DiscoveryRequest) -> "DiscoveryCachedEntry":
        return DiscoveryCachedEntry(
            nvr_uuid=discovery.nvr_uuid,
            cached_cameras={
                camera.mac_address: DiscoveryCachedCamera(
                    camera=camera, cached_at=discovery.discovery_time
                )
                for camera in discovery.cameras
            },
            last_discovery_time=discovery.discovery_time,
        )

    def update_from_discovery(
        self,
        discovery: DiscoveryRequest,
        time_now_factory: Callable[[], AwareDatetime] = lambda: AwareDatetime.utcnow(),
    ) -> None:
        discovery_cameras = {camera.mac_address: camera for camera in discovery.cameras}
        current_cameras_macs = set(self.cached_cameras.keys())
        discovery_cameras_macs = set(discovery_cameras.keys())
        # add all new cameras
        for mac_address in discovery_cameras_macs - current_cameras_macs:
            self.cached_cameras[mac_address] = DiscoveryCachedCamera(
                camera=discovery_cameras[mac_address],
                cached_at=discovery.discovery_time,
            )
        # update all existing cameras
        for mac_address in current_cameras_macs & discovery_cameras_macs:
            self.cached_cameras[mac_address].camera = discovery_cameras[mac_address]
            self.cached_cameras[mac_address].cached_at = discovery.discovery_time
        # remove all cameras that are not in the discovery and are stale
        stale_time = time_now_factory() - CACHE_CAMERA_STALE_TIME
        for mac_address in current_cameras_macs - discovery_cameras_macs:
            if self.cached_cameras[mac_address].cached_at < stale_time:
                del self.cached_cameras[mac_address]

        self.last_discovery_time = discovery.discovery_time
