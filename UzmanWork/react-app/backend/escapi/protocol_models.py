import enum
from typing import Annotated, Literal, Union

import pydantic
from pydantic import validator

from backend import ws_models
from backend.database.models import VideoOrientationType
from backend.s3_utils import S3Path
from backend.utils import AwareDatetime


class VideoResRequestType(str, enum.Enum):
    Low = "Low"
    High = "High"
    Low320P = "Low320P"
    Low480P = "Low480P"
    High1080P = "High1080P"


class VideoRequestType(str, enum.Enum):
    LIVE = "live"
    CLIP = "clip"
    Upload = "upload"
    Batched = "batched"


class StreamControlType(str, enum.Enum):
    Start = "Start"
    Stop = "Stop"


class VideoOverlayType(str, enum.Enum):
    Empty = "Empty"
    LocalDateTime = "LocalDateTime"


class RequestLiveBody(pydantic.BaseModel):
    request_type: Literal[VideoRequestType.LIVE] = VideoRequestType.LIVE
    live_stream_name: str
    mac_address: str
    nvr_uuid: str
    video_res_request: VideoResRequestType
    supports_dynamic_resolution: bool
    use_webrtc: bool
    retention_period_hours: int


class RequestClipBody(pydantic.BaseModel):
    request_type: Literal[VideoRequestType.CLIP] = VideoRequestType.CLIP
    live_stream_name: str
    upload_stream_name: str
    start_time: AwareDatetime
    end_time: AwareDatetime
    retention_period_hours: int | None
    mac_address: str
    nvr_uuid: str
    video_orientation_type: VideoOrientationType
    control_type: StreamControlType
    video_res_request: VideoResRequestType = VideoResRequestType.High
    supports_dynamic_resolution: bool


class RequestUploadBody(pydantic.BaseModel):
    request_type: Literal[VideoRequestType.Upload] = VideoRequestType.Upload
    start_time: AwareDatetime
    end_time: AwareDatetime
    mac_address: str
    nvr_uuid: str
    video_overlay_type: VideoOverlayType
    clip_data_id: str
    video_orientation_type: VideoOrientationType


class BatchedRequestsBody(pydantic.BaseModel):
    request_type: Literal[VideoRequestType.Batched] = VideoRequestType.Batched
    requests: list[RequestClipBody | RequestLiveBody | RequestUploadBody]


class UserClipUploadResponse(pydantic.BaseModel):
    clip_id: str
    s3_path: S3Path


class UserClipsUploadResponse(pydantic.BaseModel):
    # TODO: remove | None when edge is updated with response including nvr_uuid
    nvr_uuid: str | None
    responses: list[UserClipUploadResponse] = pydantic.Field(default=[], max_items=100)

    @validator("responses")
    def validate_responses(
        cls, responses: list[UserClipUploadResponse]
    ) -> list[UserClipUploadResponse]:
        if len(responses) == 0:
            raise ValueError("No responses")
        return responses


VideoRequestBody = Annotated[
    Union[RequestLiveBody, RequestClipBody, RequestUploadBody],
    pydantic.Field(discriminator="request_type"),
]


class ESCAPIMessageFrame(pydantic.BaseModel):
    command: Literal[ws_models.APICommands.MESSAGE] = ws_models.APICommands.MESSAGE
    body: VideoRequestBody


ESCAPIFrame = Annotated[
    Union[
        ws_models.APIConnectFrame,
        ws_models.APIConnectedFrame,
        ws_models.APISubscribeFrame,
        ws_models.APIErrorFrame,
        ESCAPIMessageFrame,
    ],
    pydantic.Field(discriminator="command"),
]
