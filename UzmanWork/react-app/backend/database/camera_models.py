from __future__ import annotations

from pydantic import BaseModel

from backend.utils import AwareDatetime


class UpdateCameraStreamDetails(BaseModel):
    mac_address: str
    width: int
    height: int
    fps: int
    bitrate_kbps: int
    codec: str
    last_seen_time: AwareDatetime
