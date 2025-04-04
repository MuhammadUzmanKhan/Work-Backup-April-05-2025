from __future__ import annotations

from pydantic import BaseModel

from backend.utils import AwareDatetime


class CameraDowntime(BaseModel):
    id: int
    camera_mac_address: str
    downtime_start: AwareDatetime
    downtime_end: AwareDatetime

    class Config:
        orm_mode = True


class AddCameraDowntime(BaseModel):
    camera_mac_address: str
    downtime_start: AwareDatetime
    downtime_end: AwareDatetime


class UpdateCameraDowntimeWithId(BaseModel):
    downtime_id: int
    downtime_end: AwareDatetime


class UpdateCameraDowntimeWithMac(BaseModel):
    camera_mac_address: str
    downtime_end: AwareDatetime
