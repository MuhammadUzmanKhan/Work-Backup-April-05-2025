from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from pydantic import BaseModel, validator

from backend.database.models import MctImage
from backend.models import CameraResponse
from backend.utils import AwareDatetime
from backend.validators import validate_end_time_after_start


class JourneyFromTrackRequest(BaseModel):
    # mac address of the track
    camera_mac_address: str
    # timestamp of the track
    timestamp: AwareDatetime
    # track id infos
    track_id: int
    perception_stack_start_id: str
    # Start time of the search interval
    search_start_time: AwareDatetime
    # End time of the search interval
    search_end_time: AwareDatetime


class JourneyIntervalBase(BaseModel):
    # Start time of the interval
    start_time: AwareDatetime
    # End time
    end_time: AwareDatetime
    # Mac address for the camera
    mac_address: str
    # S3 path to the cropped bounding box
    thumbnail_s3_path: str | None


class JourneyInterval(JourneyIntervalBase):
    """JourneyInterval is a helper class to define a video CLIP returned by
    Journey search
    """

    # The camera that the interval is from
    camera: CameraResponse


class TracksThumbnailRequest(BaseModel):
    start_time: AwareDatetime
    end_time: AwareDatetime
    mac_address: str

    @validator("end_time")
    def end_time_validate(
        cls, end_time: AwareDatetime, values: dict[str, Any]
    ) -> AwareDatetime:
        return validate_end_time_after_start(end_time, values)


class TrackThumbnailResponse(BaseModel):
    thumbnail_data: MctImage
    signed_url: str


@dataclass
class RankedJourneyInterval:
    interval: JourneyIntervalBase
    rank: int

    def merge_with(self, other: "RankedJourneyInterval") -> "RankedJourneyInterval":
        """Merge two intervals together into a new one."""
        return RankedJourneyInterval(
            rank=min(self.rank, other.rank),
            interval=JourneyIntervalBase(
                start_time=min(self.interval.start_time, other.interval.start_time),
                end_time=max(self.interval.end_time, other.interval.end_time),
                mac_address=self.interval.mac_address,
                thumbnail_s3_path=(
                    other.interval.thumbnail_s3_path
                    if not self.interval.thumbnail_s3_path
                    or (other.interval.thumbnail_s3_path and other.rank < self.rank)
                    else self.interval.thumbnail_s3_path
                ),
            ),
        )
