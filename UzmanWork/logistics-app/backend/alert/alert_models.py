from abc import ABC, abstractmethod
from datetime import timedelta
from functools import partial
from typing import Callable, List

from pydantic import BaseModel

from backend.alert.alert_sending import (
    format_lpoi_alert_message,
    format_poi_alert_message,
)
from backend.constants import (
    ALERT_VIDEO_EXPIRATION_DURATION,
    FACE_ALERT_COOLDOWN_DURATION,
    LICENSE_PLATE_ALERT_COOLDOWN_DURATION,
)
from backend.database.face_models import FaceOccurrence
from backend.database.models import (
    FaceAlertProfile,
    LicensePlateAlertProfile,
    LicensePlateEvent,
    NotificationGroupMember,
)
from backend.email_sending import LICENSE_PLATE_SUBJECT, PERSON_INTEREST_SUBJECT
from backend.utils import AwareDatetime
from backend.value_store.value_store import (
    get_license_plate_of_interest_alert_key,
    get_person_of_interest_alert_key,
)


class AlertOccurrenceBase(ABC, BaseModel):
    location_name: str | None
    group_name: str
    camera_name: str

    @property
    @abstractmethod
    def profile_id(self) -> int: ...

    @property
    @abstractmethod
    def all_members_to_notify(self) -> List[NotificationGroupMember]: ...

    @property
    @abstractmethod
    def occurrence_time(self) -> AwareDatetime: ...

    @property
    @abstractmethod
    def mac_address(self) -> str: ...

    @property
    @abstractmethod
    def value_store_key(self) -> str: ...

    @abstractmethod
    def get_format_alert_message(
        self, web_app_url: str, unique_shared_video_hash: str
    ) -> Callable[..., str]: ...

    @staticmethod
    @abstractmethod
    def get_email_subject() -> str: ...

    @staticmethod
    @abstractmethod
    def get_alert_cooldown_duration() -> timedelta: ...


class FaceAlertOccurrence(AlertOccurrenceBase):
    alert_profile: FaceAlertProfile
    detection: FaceOccurrence

    @property
    def profile_id(self) -> int:
        return self.alert_profile.id

    @property
    def all_members_to_notify(self) -> List[NotificationGroupMember]:
        return self.alert_profile.get_all_members_to_notify()

    @property
    def occurrence_time(self) -> AwareDatetime:
        return self.detection.occurrence_time

    @property
    def mac_address(self) -> str:
        return self.detection.camera_mac_address

    @property
    def value_store_key(self) -> str:
        return get_person_of_interest_alert_key(self.alert_profile.id)

    def get_format_alert_message(
        self, web_app_url: str, unique_shared_video_hash: str
    ) -> Callable[..., str]:
        return partial(
            format_poi_alert_message,
            person_name=self.alert_profile.description or "Untitled",
            location_name=self.location_name,
            group_name=self.group_name,
            camera_name=self.camera_name,
            web_app_url=web_app_url,
            unique_shared_video_hash=unique_shared_video_hash,
            expiration_dur=ALERT_VIDEO_EXPIRATION_DURATION,
        )

    @staticmethod
    def get_email_subject() -> str:
        return PERSON_INTEREST_SUBJECT

    @staticmethod
    def get_alert_cooldown_duration() -> timedelta:
        return FACE_ALERT_COOLDOWN_DURATION


class LicensePlateAlertOccurrence(AlertOccurrenceBase):
    alert_profile: LicensePlateAlertProfile
    detection: LicensePlateEvent

    @property
    def profile_id(self) -> int:
        return self.alert_profile.id

    @property
    def all_members_to_notify(self) -> List[NotificationGroupMember]:
        return self.alert_profile.get_all_members_to_notify()

    @property
    def occurrence_time(self) -> AwareDatetime:
        return self.detection.time

    @property
    def mac_address(self) -> str:
        return self.detection.mac_address

    @property
    def value_store_key(self) -> str:
        return get_license_plate_of_interest_alert_key(self.alert_profile.id)

    def get_format_alert_message(
        self, web_app_url: str, unique_shared_video_hash: str
    ) -> Callable[..., str]:
        return partial(
            format_lpoi_alert_message,
            license_plate_number=self.alert_profile.license_plate_number,
            location_name=self.location_name,
            group_name=self.group_name,
            camera_name=self.camera_name,
            web_app_url=web_app_url,
            unique_shared_video_hash=unique_shared_video_hash,
            expiration_dur=ALERT_VIDEO_EXPIRATION_DURATION,
        )

    @staticmethod
    def get_email_subject() -> str:
        return LICENSE_PLATE_SUBJECT

    @staticmethod
    def get_alert_cooldown_duration() -> timedelta:
        return LICENSE_PLATE_ALERT_COOLDOWN_DURATION


class FaceAlertsSendRequest(BaseModel):
    tenant: str
    alert_occurrences: List[FaceAlertOccurrence]


class LicensePlateAlertsSendRequest(BaseModel):
    tenant: str
    alert_occurrences: List[LicensePlateAlertOccurrence]
