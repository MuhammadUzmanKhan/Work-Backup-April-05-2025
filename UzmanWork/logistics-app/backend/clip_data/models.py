from typing import Any

from pydantic import BaseModel, validator

from backend.database.models import VideoOrientationType
from backend.escapi.protocol_models import VideoOverlayType
from backend.utils import AwareDatetime
from backend.validators import validate_end_time_after_start


class VideoClipUploadRequestFromClient(BaseModel):
    live_stream_name: str
    start_time: AwareDatetime
    end_time: AwareDatetime
    overlay_type: VideoOverlayType

    @validator("end_time")
    def end_time_validate(
        cls, end_time: AwareDatetime, values: dict[str, Any], **kwargs: Any
    ) -> AwareDatetime:
        return validate_end_time_after_start(end_time, values)


class ClipArchiveRequest(BaseModel):
    nvr_uuid: str
    mac_address: str
    clip_id: int
    start_time: AwareDatetime
    end_time: AwareDatetime
    tenant: str
    video_orientation_type: VideoOrientationType

    @validator("end_time")
    def end_time_validate(
        cls, end_time: AwareDatetime, values: dict[str, Any], **kwargs: Any
    ) -> AwareDatetime:
        return validate_end_time_after_start(end_time, values)
