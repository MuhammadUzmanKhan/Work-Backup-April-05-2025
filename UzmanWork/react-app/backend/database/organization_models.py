import enum

from pydantic import BaseModel


class OrganizationBase(BaseModel):
    tenant: str
    name: str


class OrganizationCreate(OrganizationBase):
    pass


class OrgCamerasAudioSettings(enum.Enum):
    ENABLED = "enabled"
    DISABLED = "disabled"
    MANUAL = "manual"


class OrgCamerasWebRTCSettings(enum.Enum):
    ENABLED = "enabled"
    DISABLED = "disabled"
    MANUAL = "manual"


class Organization(OrganizationBase):
    id: int
    retention_hours_always_on_streams: int
    inactive_user_logout_enabled: bool
    low_res_bitrate_kbps: int
    cameras_audio_settings: OrgCamerasAudioSettings
    cameras_webrtc_settings: OrgCamerasWebRTCSettings

    class Config:
        orm_mode = True
