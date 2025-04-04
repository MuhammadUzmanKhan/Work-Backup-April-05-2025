from __future__ import annotations

from typing import Any

from pydantic import BaseModel, validator

from backend.database.network_scan_models import NetworkScanSettings
from backend.database.organization_models import (
    OrgCamerasAudioSettings,
    OrgCamerasWebRTCSettings,
)
from backend.utils import AwareDatetime
from backend.validators import validate_end_time_after_start


class CreateOrganizationRequest(BaseModel):
    name: str


class UpdateInactiveUserLogoutRequest(BaseModel):
    inactive_user_logout_enabled: bool


class AccessLogsResponse(BaseModel):
    action: str
    timestamp: AwareDatetime
    user_email: str
    ip_address: str
    details: dict[str, str] | None


class AccessLogsRequest(BaseModel):
    start_time: AwareDatetime
    end_time: AwareDatetime

    @validator("end_time")
    def end_time_validate(
        cls, end_time: AwareDatetime, values: dict[str, Any]
    ) -> AwareDatetime:
        return validate_end_time_after_start(end_time, values)


class OrgCamerasAudioSettingsUpdateRequest(BaseModel):
    audio_settings: OrgCamerasAudioSettings


class OrgCamerasWebRTCSettingsUpdateRequest(BaseModel):
    webrtc_settings: OrgCamerasWebRTCSettings


class OrgNumberLicensesCamerasUpdateRequest(BaseModel):
    number_licensed_cameras: int | None


class OrgNumberLicensesCamerasResponse(BaseModel):
    number_licensed_cameras: int | None


class NetworkScanSettingsUpdateRequest(BaseModel):
    network_scan_settings: NetworkScanSettings


class NetworkScanSettingsResponse(BaseModel):
    network_scan_settings: NetworkScanSettings
