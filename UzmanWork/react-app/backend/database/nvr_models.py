from __future__ import annotations

from pydantic import BaseModel

from backend.utils import AwareDatetime


class NVRException(Exception):
    pass


class NVRUpdateError(NVRException):
    pass


class NvrNetworkInterface(BaseModel):
    name: str
    ip_address: str | None = None
    mac_address: str | None = None


class NvrNetworkInfo(BaseModel):
    last_scan_time: AwareDatetime
    network_interfaces: list[NvrNetworkInterface] = []


class NvrInfo(BaseModel):
    network_info: NvrNetworkInfo
