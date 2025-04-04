from __future__ import annotations

import enum
from abc import ABC, abstractmethod
from datetime import timedelta
from typing import Annotated, Any, Literal, Union

from pydantic import BaseModel, Field, validator

from backend.utils import AwareDatetime
from backend.validators import validate_end_time_after_start


class TimeRangeType(str, enum.Enum):
    ABSOLUTE = "absolute"
    RELATIVE = "relative"


class TimeRangeBase(ABC, BaseModel):
    """
    Abstract base class for time range.
    """

    @abstractmethod
    def get_start_time(self) -> AwareDatetime:
        raise NotImplementedError(
            "Subclasses must implement the get_start_time method."
        )

    @abstractmethod
    def get_end_time(self) -> AwareDatetime:
        raise NotImplementedError("Subclasses must implement the get_end_time method.")


class AbsoluteTimeRange(TimeRangeBase):
    time_range_type: Literal[TimeRangeType.ABSOLUTE] = TimeRangeType.ABSOLUTE
    start_time: AwareDatetime
    end_time: AwareDatetime

    def get_start_time(self) -> AwareDatetime:
        return self.start_time

    def get_end_time(self) -> AwareDatetime:
        return self.end_time

    @validator("end_time")
    def end_time_validate(
        cls, end_time: AwareDatetime, values: dict[str, Any]
    ) -> AwareDatetime | None:
        return validate_end_time_after_start(end_time, values)


class RelativeTimeRange(TimeRangeBase):
    time_range_type: Literal[TimeRangeType.RELATIVE] = TimeRangeType.RELATIVE
    time_interval: timedelta

    def get_start_time(self) -> AwareDatetime:
        return AwareDatetime.utcnow() - self.time_interval

    def get_end_time(self) -> AwareDatetime:
        return AwareDatetime.utcnow()


TimeRange = Annotated[
    Union[AbsoluteTimeRange, RelativeTimeRange], Field(discriminator="time_range_type")
]
