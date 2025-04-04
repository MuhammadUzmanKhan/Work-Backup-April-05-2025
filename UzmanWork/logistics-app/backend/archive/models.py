from typing import Any

from pydantic import BaseModel, EmailStr, Field, validator

from backend.constants import REGEX_MAC_ADDRESS
from backend.database.models import Archive, ArchiveClipData, ArchiveComment
from backend.kinesis_api.constants import ON_DEMAND_MODE
from backend.tag import models as tag_models
from backend.thumbnail.models import ThumbnailResponse
from backend.utils import AwareDatetime
from backend.validators import validate_end_time_after_start


class ArchiveClip(BaseModel):
    mac_address: str = Field(regex=REGEX_MAC_ADDRESS)
    start_time: AwareDatetime
    end_time: AwareDatetime

    @validator("end_time")
    def end_time_validate(
        cls, end_time: AwareDatetime, values: dict[str, Any]
    ) -> AwareDatetime:
        return validate_end_time_after_start(end_time, values)


class ArchiveRequest(BaseModel):
    clip_request: ArchiveClip
    title: str
    archive_description: str
    tags: list[int]


class ArchiveAddClipRequest(BaseModel):
    archive_clip: ArchiveClip
    comment: str | None


class ShareArchiveRequest(BaseModel):
    archive_id: int
    # TODO: Why is this not EmailStr?
    sender_email: str
    emails: list[EmailStr]

    @validator("emails")
    def remove_sender_email(
        cls, emails: list[EmailStr], values: dict[str, Any]
    ) -> list[EmailStr]:
        sender_email = values["sender_email"]
        return [email for email in emails if email != sender_email]


class ArchiveSummaryResponse(BaseModel):
    id: int
    title: str
    description: str


class ArchiveResponse(Archive):
    clips_preview_thumbnails: dict[int, ThumbnailResponse] = {}
    tags: list[tag_models.TagResponse] = []


class ArchiveCommentRequest(BaseModel):
    archive_id: int
    comment: str = Field(min_length=1)


class ArchiveCommentResponse(BaseModel):
    comment: ArchiveComment
    attached_clip_data: ArchiveClipData | None = None


class ArchiveClipParams(BaseModel):
    start_time: AwareDatetime
    end_time: AwareDatetime
    upload_stream_name: str
    hls_playback_mode: str = ON_DEMAND_MODE


class SetArchiveTagsRequest(BaseModel):
    tag_ids: list[int]
