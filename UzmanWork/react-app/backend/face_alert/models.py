from pydantic import BaseModel, HttpUrl

from backend.database.face_models import OrgUniqueFaceIdentifier, UniqueFaceOccurrence
from backend.database.models import (
    FaceAlertProfile,
    FaceAlertProfileIdentifier,
    NotificationGroup,
)
from backend.utils import AwareDatetime


class FaceAlertsDiscoveryRequest(BaseModel):
    start_time: AwareDatetime
    end_time: AwareDatetime
    mac_addresses: set[str]
    location_ids: set[int]


class FaceAlertProfileRequest(BaseModel):
    profile_identifier: FaceAlertProfileIdentifier | OrgUniqueFaceIdentifier


class RegisterFaceAlertProfileRequest(BaseModel):
    description: str | None
    is_person_of_interest: bool
    org_unique_face_id: int


class FaceAlertProfileResponse(BaseModel):
    alert_profile: FaceAlertProfile
    s3_signed_url: HttpUrl


class OptionalFaceAlertProfileResponse(BaseModel):
    alert_profile_response: FaceAlertProfileResponse | None


class UpdateNotificationGroupsRequest(BaseModel):
    notification_group_ids: set[int]


class FaceAlertResponse(BaseModel):
    unique_face_occurrence: UniqueFaceOccurrence
    face_profile_id: int
    description: str | None
    notification_groups: list[NotificationGroup]
    face_profile_s3_signed_url: HttpUrl
