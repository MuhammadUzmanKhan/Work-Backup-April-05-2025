import datetime
import enum
from typing import Annotated, Literal, Union

import pydantic
from pydantic import BaseModel

from backend.database.models import DayOfWeek


class ScanMode(str, enum.Enum):
    AUTO = "auto"
    MANUAL = "manual"
    SCHEDULED = "scheduled"


class NetworkScanAuto(BaseModel):
    mode: Literal[ScanMode.AUTO] = ScanMode.AUTO


class NetworkScanManual(BaseModel):
    mode: Literal[ScanMode.MANUAL] = ScanMode.MANUAL


class NetworkScanScheduled(BaseModel):
    mode: Literal[ScanMode.SCHEDULED] = ScanMode.SCHEDULED
    days: list[DayOfWeek]
    # NOTE(@lberg): we don't care about timezones here
    # because different NVRs can be in different timezones
    start_time: datetime.time
    end_time: datetime.time


NetworkScanSettings = Annotated[
    Union[NetworkScanScheduled, NetworkScanAuto, NetworkScanManual],
    pydantic.Field(discriminator="mode"),
]
