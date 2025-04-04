import enum
import re
from datetime import timedelta, timezone
from typing import Annotated, Any, Literal, Protocol, Union

import pydantic
from fastapi import Body, Response
from pydantic import AnyHttpUrl, BaseModel, validator

from backend.escapi.protocol_models import VideoResRequestType
from backend.kinesis_api.constants import (
    KINESIS_MAX_EXPIRE_TIME,
    LIVE_REPLAY_MODE,
    ON_DEMAND_MODE,
)
from backend.kinesis_api.errors import KinesisStreamNameError
from backend.utils import AwareDatetime


class DynamicResolutionConfig(BaseModel):
    preferred_resolution: VideoResRequestType

    @property
    def resolution(self) -> VideoResRequestType:
        return self.preferred_resolution

    def set_resolution(self, value: VideoResRequestType) -> None:
        self.preferred_resolution = value

    @property
    def supports_dynamic_resolution(self) -> bool:
        return True


class StaticResolutionConfig(BaseModel):
    static_resolution: VideoResRequestType

    @property
    def resolution(self) -> VideoResRequestType:
        return self.static_resolution

    def set_resolution(self, value: VideoResRequestType) -> None:
        self.static_resolution = value

    @property
    def supports_dynamic_resolution(self) -> bool:
        return False


class KinesisVideoClipRequest(BaseModel):
    mac_address: str
    start_time: AwareDatetime
    end_time: AwareDatetime
    resolution_config: StaticResolutionConfig | DynamicResolutionConfig

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


class KinesisArchivedVideoClipRequest(KinesisVideoClipRequest):
    archive_id: int
    clip_id: int


class KinesisVideoClipConfig(BaseModel):
    start_time: AwareDatetime
    end_time: AwareDatetime
    # Resolution and support for dynamic resolution
    resolution_config: DynamicResolutionConfig | StaticResolutionConfig

    stream_hash: str
    # A unique id for this clip request that we can use to ensure the generated
    # upload_stream_name is unique. This will be used to ensure we don't
    # upload to the same Kinesis stream twice, since this caused "looping" video
    # playback issues if we were viewing the clip while it was being uploaded.
    # The default value is "shared" because we want to use the same stream for
    # all "shared videos" and alerts. Since we might upload to these streams
    # multiple times, these can only be played in "ON_DEMAND" mode to avoid the
    # "looping" issue, so when we request the HLS URL, we need to specify the
    # mode as "ON_DEMAND".  This is done in the `clip_kinesis_request` function
    # in `kinesis_api/utils.py`.
    clip_stream_unique_id: str

    # If set, request the edge to upload the clip to the specified stream with
    # the specified retention period.
    retention_period: timedelta | None = None

    @property
    def sub_stream_name_with_time(self) -> str:
        # Pattern that matches a special character that is not allowed in
        # Kinesis stream names.
        pattern = r"[^a-zA-Z0-9_.-]"
        # Convert timezones to have same ISO string format
        start_time = self.start_time.astimezone(
            timezone(timedelta(days=-1, seconds=57600))
        )
        end_time = self.end_time.astimezone(timezone(timedelta(days=-1, seconds=57600)))
        start_time_iso = re.sub(pattern, "_", start_time.isoformat(timespec="seconds"))
        end_time_iso = re.sub(pattern, "_", end_time.isoformat(timespec="seconds"))
        return f"_{start_time_iso}_" + f"{end_time_iso}_{self.clip_stream_unique_id}"

    @property
    def upload_stream_name(self) -> str:
        """Get a string we can use for the kinesis stream name for this clip.
        Use a regex to enforce the same expression kinesis expects.

        :return: The kinesis stream name
        """
        return f"{self.stream_hash}{self.sub_stream_name_with_time}"

    @property
    def hls_playback_mode(self) -> str:
        """Get the HLS playback mode to use when requesting the HLS URL for this
        clip.  If the clip stream unique id is "shared", then we want to use the
        "ON_DEMAND" mode. Otherwise, we want to use the "LIVE_REPLAY" mode.

        :return: The HLS playback mode to use
        """
        if self.clip_stream_unique_id == "shared":
            return ON_DEMAND_MODE
        return LIVE_REPLAY_MODE


class KinesisSharedVideoClipConfig(KinesisVideoClipConfig):
    # The default value is "shared" because we want to use the same stream for
    # all "shared videos" and alerts. Since we might upload to these streams
    # multiple times, these can only be played in "ON_DEMAND" mode to avoid the
    # "looping" issue, so when we request the HLS URL, we need to specify the
    # mode as "ON_DEMAND".  This is done in the `clip_kinesis_request` function
    # in `kinesis_api/utils.py`.
    # See more details in KinesisVideoClipRequest.clip_stream_unique_id.
    clip_stream_unique_id: str = "shared"

    @validator("resolution_config")
    def resolution_config_validate(
        cls, resolution_config: DynamicResolutionConfig | StaticResolutionConfig
    ) -> DynamicResolutionConfig | StaticResolutionConfig:
        """Enforce a static high resolution for shared clip."""
        if not isinstance(resolution_config, (StaticResolutionConfig)):
            raise ValueError(f"{resolution_config=} must be static for shared clip.")
        if resolution_config.static_resolution != VideoResRequestType.High:
            raise ValueError(
                f"{resolution_config.static_resolution=} must be High for shared clip."
            )
        return resolution_config


class KinesisArchivedVideoClipConfig(KinesisSharedVideoClipConfig):
    clip_id: int

    def forward_using_stream_name(
        self, stream_name: str
    ) -> "KinesisArchivedVideoClipConfig":
        """A camera can get associated to a different NVR, but if there're clips created
        when camera was associated with the old NVR, the clip stream name in the db
        still persist. This function will forward the clip request so it is possible
        to fetch data from the persisted clip stream name.
        NOTE: This is to handle legacy data.
        """
        if stream_name.find(self.clip_stream_unique_id) == -1:
            raise KinesisStreamNameError(f"{stream_name=} is invalid.")

        sub_stream_name_with_time = self.sub_stream_name_with_time

        # The timestamp in the clip data entry stream name should match with the
        # request.
        if stream_name.find(sub_stream_name_with_time) == -1:
            raise KinesisStreamNameError(
                f"{stream_name=} does not match with "
                f"{self.upload_stream_name=} in timestamp. "
            )

        # Construct a KinesisVideoClipRequestArchive object with the live stream name
        # matches with the clip data entry stream name.
        idx_request = stream_name.find(sub_stream_name_with_time)
        live_stream_name = stream_name[:idx_request]

        return KinesisArchivedVideoClipConfig(
            stream_hash=live_stream_name,
            start_time=self.start_time,
            end_time=self.end_time,
            clip_id=self.clip_id,
            retention_period=self.retention_period,
            resolution_config=self.resolution_config,
        )


class KinesisVideoLiveRequest(BaseModel):
    mac_address: str
    resolution_config: StaticResolutionConfig
    log_live_activity: bool
    prefer_webrtc: bool


class KinesisVideoKeepAliveRequest(BaseModel):
    mac_address: str
    resolution_config: StaticResolutionConfig


class KinesisVideoLiveConfig(BaseModel):
    stream_hash: str
    resolution_config: StaticResolutionConfig
    use_webrtc: bool
    expires: timedelta = KINESIS_MAX_EXPIRE_TIME
    # The retention period this live stream.
    retention_period: timedelta

    @property
    def upload_stream_name(self) -> str:
        """Get a string we can use for the kinesis stream name for this live stream."""

        if self.resolution_config.resolution == VideoResRequestType.High:
            # We change the stream here as iOS does not support mixed
            # resolution streams.
            return f"{self.stream_hash}-HQ"
        return self.stream_hash


class KinesisFragmentInfo(BaseModel):
    # The fragment number is a string because the AWS Kinesis Video Streams
    # API uses a string for the fragment number.
    # See
    # https://docs.aws.amazon.com/kinesisvideostreams/latest/dg/API_reader_ListFragments.html
    fragment_number: str
    start_time: AwareDatetime
    end_time: AwareDatetime


class KinesisClipRetentionHoursUpdateRequest(BaseModel):
    kvs_stream_name: str
    expiration_time: AwareDatetime


class KinesisLiveRetentionHoursUpdateRequest(BaseModel):
    kvs_stream_name: str
    retention_duration: timedelta


class KinesisStreamRequestType(str, enum.Enum):
    CREATION = "CREATION"
    VIEW = "VIEW"


class KinesisStreamCreationRequest(BaseModel):
    request_type: Literal[KinesisStreamRequestType.CREATION] = (
        KinesisStreamRequestType.CREATION
    )
    retention_duration: timedelta


class KinesisStreamViewRequest(BaseModel):
    request_type: Literal[KinesisStreamRequestType.VIEW] = KinesisStreamRequestType.VIEW
    retention_duration: timedelta


KinesisStreamRequest = Annotated[
    Union[KinesisStreamCreationRequest, KinesisStreamViewRequest],
    Body(discriminator="request_type"),
]


class HlsResponse(Response):
    media_type = "application/x-mpegURL"

    def render(self, content: str) -> bytes:
        return content.encode("utf-8")


class ClipRequestIdentifier(BaseModel):
    clip_id: str
    mac_address: str


class WebRtcChannelInfo(BaseModel):
    channel_arn: str
    wss_endpoint: str
    https_endpoint: str


class IceServerData(BaseModel):
    urls: list[str] | str
    username: str | None
    credential: str | None


class WebRtcData(BaseModel):
    channel_info: WebRtcChannelInfo
    ice_servers: list[IceServerData]
    client_id: str


class WebRtcStreamResponse(BaseModel):
    data: WebRtcData
    protocol: Literal["webrtc"] = "webrtc"
    sign_token: str


class HlsData(BaseModel):
    video_url: AnyHttpUrl


class HlsStreamResponse(BaseModel):
    protocol: Literal["hls"] = "hls"
    data: HlsData


StreamResponse = Annotated[
    WebRtcStreamResponse | HlsStreamResponse, pydantic.Field(discriminator="protocol")
]


class KinesisClipParams(Protocol):
    @property
    def upload_stream_name(self) -> str: ...

    @property
    def start_time(self) -> AwareDatetime: ...

    @property
    def end_time(self) -> AwareDatetime: ...

    @property
    def hls_playback_mode(self) -> str: ...


class AlwayOnClipParams(BaseModel):
    upload_stream_name: str
    start_time: AwareDatetime
    end_time: AwareDatetime

    @property
    def hls_playback_mode(self) -> str:
        return ON_DEMAND_MODE
