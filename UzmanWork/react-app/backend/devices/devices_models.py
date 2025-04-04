import pydantic

from backend.monitor.models import CameraPipelineAlertCreate


class NVRRegistration(pydantic.BaseModel):
    uuid: str
    location_id: int


class CameraPipelineAlertResponse(pydantic.BaseModel):
    alerts_info: dict[str, CameraPipelineAlertCreate | None]


class UpdateLocationNameRequest(pydantic.BaseModel):
    location_id: int
    name: str = pydantic.Field(..., min_length=1)


class UpdateLocationAddressRequest(pydantic.BaseModel):
    location_id: int
    address: str = pydantic.Field(..., min_length=5)


class UpdateLocationEnableSettingTimezoneRequest(pydantic.BaseModel):
    location_id: int
    enable_setting_timezone: bool


class UpdateLocationTimezoneRequest(pydantic.BaseModel):
    location_id: int
    timezone: str


class DeleteCameraRequest(pydantic.BaseModel):
    mac_address: str


class CameraGroupCreateRequest(pydantic.BaseModel):
    name: str = pydantic.Field(..., min_length=1)


class CamerasExportRequest(pydantic.BaseModel):
    format: str


class NvrsExportRequest(pydantic.BaseModel):
    format: str
