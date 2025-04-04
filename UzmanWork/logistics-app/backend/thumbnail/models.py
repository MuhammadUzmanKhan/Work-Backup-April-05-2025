from typing import Any

from pydantic import BaseModel, Field, validator

from backend.constants import REGEX_MAC_ADDRESS
from backend.s3_utils import S3Path
from backend.utils import AwareDatetime


class ThumbnailResult(BaseModel):
    timestamp: AwareDatetime
    s3_path: S3Path
    s3_signed_url: str | None = None

    class Config:
        orm_mode = True


class ThumbnailResponse(ThumbnailResult):
    s3_signed_url: str


class OptionalThumbnailResponse(BaseModel):
    response: ThumbnailResponse | None


class TimelapseImageResponse(BaseModel):
    timestamp: AwareDatetime
    s3_path: str


class RequestRange(BaseModel):
    camera_mac_address: str = Field(regex=REGEX_MAC_ADDRESS)
    start_time: AwareDatetime
    end_time: AwareDatetime
    max_num_images: int = Field(gt=0)

    @validator("end_time")
    def end_time_validate(
        cls, end_time: AwareDatetime, values: dict[str, Any], **kwargs: Any
    ) -> AwareDatetime:
        if "start_time" not in values:
            raise ValueError(f"{values=}")
        start_time: AwareDatetime = values["start_time"]
        if end_time < start_time:
            raise ValueError(f"{end_time=} can't be before {start_time=}")
        return end_time


class ThumbnailTimestampRequest(BaseModel):
    mac_address: str = Field(regex=REGEX_MAC_ADDRESS)
    timestamp: AwareDatetime
    tolerance_s: float


class RequestTimelapse(BaseModel):
    camera_mac_address: str = Field(regex=REGEX_MAC_ADDRESS)
    start_time: AwareDatetime
    end_time: AwareDatetime

    @validator("end_time")
    def end_time_validate(
        cls, end_time: AwareDatetime, values: dict[str, Any], **kwargs: Any
    ) -> AwareDatetime:
        if "start_time" not in values:
            raise ValueError(f"{values=}")
        start_time: AwareDatetime = values["start_time"]
        if end_time < start_time:
            raise ValueError(f"{end_time=} can't be before {start_time=}")
        return end_time
