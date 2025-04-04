from pydantic import BaseModel

from backend.database.access_points_models import AccessPointVendor
from backend.utils import AwareDatetime


class BrivoGetApiKeyResponse(BaseModel):
    api_key: str | None = None


class BrivoSetApiKeyRequest(BaseModel):
    api_key: str


class ListAccessPointEventsRequest(BaseModel):
    start_time: AwareDatetime
    end_time: AwareDatetime


class AccessPointEventResponse(BaseModel):
    # In Alta events which has no result are not associated with any Entry which
    # we call AccessPoint here. Instead, they are associated with some ACU (controller)
    # Access Control Unit. We don't have an ACU concept atm.
    access_point_id: str | None = None
    vendor: AccessPointVendor
    description: str | None = None
    result: str
    time: AwareDatetime
    actor: str | None = None


class AccessPointCameraInfo(BaseModel):
    mac_address: str
    is_favorite: bool


class AccessPointResponse(BaseModel):
    id: str
    name: str
    vendor: AccessPointVendor
    location_id: int | None = None
    cameras: list[AccessPointCameraInfo]
    remote_unlock_enabled: bool


class SetAccessPointLocationRequest(BaseModel):
    access_point_id: str
    vendor: AccessPointVendor
    location_id: int | None = None


class AssignAccessPointCameraRequest(BaseModel):
    access_point_id: str
    vendor: AccessPointVendor
    camera_mac_address: str


class UnassignAccessPointCameraRequest(BaseModel):
    access_point_id: str
    vendor: AccessPointVendor
    camera_mac_address: str


class SetFavoriteCameraRequest(BaseModel):
    access_point_id: str
    vendor: AccessPointVendor
    camera_mac_address: str


class AuthorizeAltaRequest(BaseModel):
    email: str
    password: str
    mfa_code: str | None = None
    enable_remote_unlock: bool = True


class AccessControlIntegration(BaseModel):
    vendor: AccessPointVendor
    is_active: bool
    remote_unlock_enabled: bool


class UnlockAccessPointRequest(BaseModel):
    id: str
    vendor: AccessPointVendor
