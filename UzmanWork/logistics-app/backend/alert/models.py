from datetime import timedelta
from enum import Enum

from pydantic import BaseModel

from backend.utils import AwareDatetime


class ShareMethod(Enum):
    Email = "Email"
    SMS = "SMS"


class SharedFormatData(BaseModel):
    unique_shared_video_hash: str
    expiration_dur: timedelta
    location_name: str
    camera_name: str
    share_method: ShareMethod
    message: str | None


class SharedLiveStreamFormat(SharedFormatData):
    pass


class SharedVideoFormat(SharedFormatData):
    start_time: AwareDatetime
    end_time: AwareDatetime
    timezone_name: str
