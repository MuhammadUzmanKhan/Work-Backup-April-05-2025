from typing import Protocol, Sequence

from pydantic import EmailStr

from backend import auth, auth_models
from backend.database.face_models import FaceOccurrence, NVRUniqueFace
from backend.database.models import (
    NVR,
    Camera,
    CameraGroup,
    ClipData,
    FaceAlertProfile,
    FeatureFlags,
    LicensePlate,
    LicensePlateAlertProfile,
    Location,
    NotificationGroup,
    NotificationGroupMemberCreate,
)
from backend.database.organization_models import Organization
from backend.models import CameraWithOnlineStatus
from backend.s3_utils import S3Path
from backend.utils import AwareDatetime


class RandomStringFactory(Protocol):
    def __call__(self) -> str: ...


class OrganizationFactory(Protocol):
    async def __call__(
        self, tenant: str | None = None, number_licensed_cameras: int | None = None
    ) -> Organization: ...


class LocationFactory(Protocol):
    async def __call__(self, tenant: str, name: str | None = None) -> Location: ...


class LocationDefaultFactory(Protocol):
    async def __call__(self) -> Location: ...


class CameraGroupFactory(Protocol):
    async def __call__(
        self, tenant: str, name: str | None = None, is_default: bool = False
    ) -> CameraGroup: ...


class CameraGroupDefaultFactory(Protocol):
    async def __call__(self) -> CameraGroup: ...


class NVRFactory(Protocol):
    async def __call__(
        self,
        location_id: int | None,
        uuid: str | None = None,
        last_seen_time: AwareDatetime | None = None,
        tenant: str | None = None,
    ) -> NVR: ...


class NVRDefaultFactory(Protocol):
    async def __call__(self) -> NVR: ...


class CameraFactory(Protocol):
    async def __call__(
        self,
        camera_group_id: int,
        nvr_uuid: str,
        mac_address: str | None = None,
        tenant: str | None = None,
        is_enabled: bool = True,
        is_always_streaming: bool = False,
        is_license_plate_detection_enabled: bool = False,
        is_audio_enabled: bool = False,
        is_faulty: bool = False,
        is_webrtc_enabled: bool = False,
        is_force_fps_enabled: bool = False,
        username: str | None = None,
        password: str | None = None,
        last_seen_time: AwareDatetime | None = None,
        rtsp_port: int = 554,
        enforced_rtsp_url: str | None = None,
    ) -> Camera: ...


class CameraWithOnlineStatusFactory(Protocol):
    async def __call__(
        self,
        camera_group_id: int,
        nvr_uuid: str,
        mac_address: str | None = None,
        is_enabled: bool = True,
        is_always_streaming: bool = False,
        is_license_plate_detection_enabled: bool = False,
        is_audio_enabled: bool = False,
        is_faulty: bool = False,
        is_online: bool = True,
    ) -> CameraWithOnlineStatus: ...


class CameraDefaultFactory(Protocol):
    async def __call__(
        self,
        mac_address: str | None = None,
        is_enabled: bool = True,
        is_always_streaming: bool = False,
        is_license_plate_detection_enabled: bool = False,
        is_audio_enabled: bool = False,
        is_faulty: bool = False,
        username: str | None = None,
        password: str | None = None,
        last_seen_time: AwareDatetime | None = None,
        rtsp_port: int = 0,
    ) -> Camera: ...


class CameraWithOnlineStatusDefaultFactory(Protocol):
    async def __call__(self) -> CameraWithOnlineStatus: ...


class ThumbnailFactory(Protocol):
    async def __call__(
        self, camera_mac_address: str, timestamp: AwareDatetime | None = None
    ) -> None:
        pass


class AppUserFactory(Protocol):
    async def __call__(
        self, tenant: str | None = None, role: auth.UserRole = auth.UserRole.ADMIN
    ) -> auth_models.AppUser: ...


class NVRUniqueFaceFactory(Protocol):
    async def __call__(
        self,
        nvr_uuid: str,
        unique_face_id: str | None = None,
        s3_path: str | None = None,
    ) -> NVRUniqueFace: ...


class FaceOccurrenceFactory(Protocol):
    async def __call__(
        self,
        nvr_uuid: str,
        mac_address: str,
        unique_face_id: str | None = None,
        s3_path: str | None = None,
        occurrence_time: AwareDatetime = AwareDatetime.utcnow(),
        face_sharpness: float = 0.9,
    ) -> FaceOccurrence: ...


class NotificationGroupFactory(Protocol):
    async def __call__(
        self, tenant: str, num_groups: int
    ) -> list[NotificationGroup]: ...


class NotificationGroupMemberFactory(Protocol):
    async def __call__(
        self,
        tenant: str,
        group_members_metadata: Sequence[NotificationGroupMemberCreate | None],
    ) -> list[NotificationGroup]: ...


class FaceAlertProfileFactory(Protocol):
    async def __call__(
        self,
        tenant: str,
        owner_user_email: EmailStr,
        org_unique_face_id: int | None = None,
        is_person_of_interest: bool = False,
        creation_time: AwareDatetime | None = None,
        description: str | None = None,
    ) -> FaceAlertProfile: ...


class LicensePlateFactory(Protocol):
    async def __call__(
        self, license_plate_number: str | None = None
    ) -> LicensePlate: ...


class LicensePlateAlertProfileFactory(Protocol):
    async def __call__(
        self,
        tenant: str,
        owner_user_email: EmailStr,
        license_plate_number: str | None = None,
        creation_time: AwareDatetime | None = None,
    ) -> LicensePlateAlertProfile: ...


class LicensePlateDetectionFactory(Protocol):
    async def __call__(
        self,
        mac_address: str,
        license_plate_number: str,
        timestamp: AwareDatetime = AwareDatetime.utcnow(),
    ) -> None: ...


class ClipDataFactory(Protocol):
    async def __call__(
        self,
        tenant: str,
        mac_address: str,
        s3_path: S3Path,
        start_time: AwareDatetime | None = None,
        end_time: AwareDatetime | None = None,
    ) -> ClipData: ...


class EnableFeatureForOrganisationFactory(Protocol):
    async def __call__(self, tenant: str, feature: FeatureFlags) -> None: ...
