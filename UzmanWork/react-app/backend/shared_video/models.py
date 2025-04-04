import logging
import random
import string
from typing import Any, Optional

from pydantic import BaseModel, EmailStr, Field, root_validator, validator

from backend import logging_config
from backend.kinesis_api.models import StaticResolutionConfig
from backend.utils import AwareDatetime
from backend.validators import validate_phone_number

logger = logging.getLogger(logging_config.LOGGER_NAME)


class SharedLiveStreamRequest(BaseModel):
    mac_address: str
    expiration_seconds: int = Field(gt=0)
    email_address: Optional[EmailStr]
    phone_number: str | None = None
    message: None | str = Field(default=None, max_length=280)
    user_name: str = Field(min_length=1)

    @validator("phone_number")
    def validate_phone_number(cls, v: str | None = None) -> Optional[str]:
        if v is None:
            return v

        return validate_phone_number(v)

    @root_validator(skip_on_failure=True)
    def check_shareable(cls, values: dict[str, Any]) -> dict[str, Any]:
        email, phone = values.get("email_address"), values.get("phone_number")
        if email is None and phone is None:
            raise ValueError("You must specify either an email or a phone number.")
        return values


class SharedVideoRequest(SharedLiveStreamRequest):
    start_time: AwareDatetime
    end_time: AwareDatetime


class SharedVideoData(BaseModel):
    live_stream_name: str
    camera_name: str
    mac_address: str
    camera_group_name: str | None = None
    camera_location: str | None = None
    timezone: str | None = None
    is_audio_enabled: bool


class SharedLiveStreamResponse(SharedVideoData):
    is_webrtc_enabled: bool


class SharedVideoResponse(SharedVideoData):
    start_time: AwareDatetime
    end_time: AwareDatetime


class SharedLiveStreamData(BaseModel):
    mac_address: str
    expiration_time: AwareDatetime
    tenant: str

    @staticmethod
    def generate_uuid() -> str:
        return "".join(
            random.choices(
                string.ascii_lowercase + string.digits + string.ascii_uppercase, k=15
            )
        )


class SharedLiveStreamKeepAliveRequest(BaseModel):
    resolution_config: StaticResolutionConfig


class ExchangeLiveRequest(BaseModel):
    resolution_config: StaticResolutionConfig
    prefer_webrtc: bool
