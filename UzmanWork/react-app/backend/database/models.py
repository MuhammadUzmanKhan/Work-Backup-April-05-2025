from __future__ import annotations

import calendar
import enum
import logging
from datetime import datetime, timedelta
from typing import Annotated, Any, List, Literal, Optional, Union

from pydantic import BaseModel, EmailStr, Field, root_validator, validator
from pydantic.dataclasses import dataclass as pyd_dataclass
from shapely.geometry import Polygon

from backend import logging_config
from backend.access_logs.constants import UserActions
from backend.constants import CAMERA_ONLINE_TIMEOUT
from backend.database.face_models import OrgUniqueFace
from backend.database.geometry_models import Point2D
from backend.multi_cam_tracking.constants import (
    JOURNEY_REQUEST_TOP_K,
    JOURNEY_REQUEST_TOP_K_MULTIPLE,
)
from backend.s3_utils import S3Path
from backend.utils import AwareDatetime, AwareTime
from backend.validators import validate_phone_number

logger = logging.getLogger(logging_config.LOGGER_NAME)


class CameraGroupBase(BaseModel):
    name: str

    class Config:
        orm_mode = True


class CameraGroupCreate(CameraGroupBase):
    is_default: bool


class CameraGroup(CameraGroupCreate):
    id: int

    class Config:
        orm_mode = True


class LocationBase(BaseModel):
    name: str = Field(..., min_length=1)
    address: str = Field(..., min_length=5)
    address_lat: float | None = None
    address_lon: float | None = None


class LocationCreate(LocationBase):
    pass


class Location(LocationBase):
    id: int
    timezone: str
    enable_setting_timezone: bool

    class Config:
        orm_mode = True


class NVRBase(BaseModel):
    uuid: str
    location_id: int | None = None
    last_seen_time: datetime | None = None
    timezone: str | None = None


class NVRCreate(NVRBase):
    pass


class NVR(NVRBase):
    id: int
    retention_days: int
    max_cameras_slots: int
    tenant: str

    class Config:
        orm_mode = True


class UpdateOrganisationRetentionRequest(BaseModel):
    tenant: str
    retention_hours: int


class UpdateNvrRetentionRequest(BaseModel):
    nvr_uuid: str
    retention_days: int


class UpdateNvrLocationRequest(BaseModel):
    nvr_uuid: str
    location_id: int


class UpdateOrgStreamRetentionRequest(BaseModel):
    tenant: str
    retention_hours: int


class UpdateOrgLowResBitrateRequest(BaseModel):
    tenant: str
    low_res_bitrate_kbps: int


class SubscriberAlertType(enum.Enum):
    EMAIL = "EMAIL"


class AlertSubscriber(BaseModel):
    alert_type: SubscriberAlertType
    alert_target: str

    class Config:
        orm_mode = True


# Source:
# https://gstreamer.freedesktop.org/documentation/video/gstvideo.html?gi-language=c#GstVideoOrientationMethod
# GST_VIDEO_ORIENTATION_IDENTITY (0) – Identity (no rotation)
# GST_VIDEO_ORIENTATION_90R (1) – Rotate clockwise 90 degrees
# GST_VIDEO_ORIENTATION_180 (2) – Rotate 180 degrees
# GST_VIDEO_ORIENTATION_90L (3) – Rotate counter-clockwise 90 degrees
# GST_VIDEO_ORIENTATION_HORIZ (4) – Flip horizontally
# GST_VIDEO_ORIENTATION_VERT (5) – Flip vertically
# GST_VIDEO_ORIENTATION_UL_LR (6) – Flip across upper left/lower right diagonal
# GST_VIDEO_ORIENTATION_UR_LL (7) – Flip across upper right/lower left diagonal
class VideoOrientationType(str, enum.Enum):
    # Identity (no rotation)
    OrientationIdentity = "OrientationIdentity"
    # Rotate clockwise 90 degrees
    Orientation90R = "Orientation90R"
    # Rotate 180 degrees
    Orientation180 = "Orientation180"
    # Rotate counter-clockwise 90 degrees
    Orientation90L = "Orientation90L"
    # Flip horizontally
    OrientationHoriz = "OrientationHoriz"
    # Flip vertically
    OrientationVert = "OrientationVert"
    # Flip across upper left/lower right diagonal
    OrientationUL_LR = "OrientationUL_LR"
    # Flip across upper right/lower left diagonal
    OrientationUR_LL = "OrientationUR_LL"


class CameraBase(BaseModel):
    mac_address: str
    nvr_uuid: str
    vendor: str
    ip: str


class CameraCreate(CameraBase):
    is_enabled: bool
    video_orientation_type: VideoOrientationType
    is_always_streaming: bool
    is_license_plate_detection_enabled: bool
    is_audio_enabled: bool
    is_faulty: bool
    is_webrtc_enabled: bool
    is_force_fps_enabled: bool
    username: str | None = None
    password: str | None = None
    last_seen_time: AwareDatetime | None = None
    # TODO(@lberg): remove optional after nvrs are updated
    rtsp_port: int = 0
    enforced_rtsp_url: str | None


class Camera(CameraCreate):
    camera_group_id: int
    stream_hash: str
    id: int
    name: str
    tenant: str
    width: int | None = None
    height: int | None = None
    fps: int | None = None
    bitrate_kbps: int | None = None
    codec: str | None = None

    # TODO(@lberg): remove once source is not used in the codebase
    @property
    def source(self) -> str:
        return self.stream_hash

    class Config:
        orm_mode = True


class ContainsEnumMeta(enum.EnumMeta):
    """General enum metaclass which supports in operator"""

    def __contains__(cls, item: object) -> bool:
        try:
            cls(item)
        except ValueError:
            return False
        return True


class FeatureFlags(enum.Enum, metaclass=ContainsEnumMeta):
    """
    The source of truth for the feature flags.
    The database table is filled automatically from the feature flags defined here.
    """

    TEST_FEATURE_FLAG = "TEST_FEATURE_FLAG"
    ASSISTANT_ENABLED = "ASSISTANT_ENABLED"
    IDLE_ALERT_ENABLED = "IDLE_ALERT_ENABLED"
    FACE_ENABLED = "FACE_ENABLED"
    ALWAYS_STREAMING_ENABLED = "ALWAYS_STREAMING_ENABLED"
    INACTIVITY_LOGOUT_ENABLED = "INACTIVITY_LOGOUT_ENABLED"
    LICENSE_PLATE_RECOGNITION_ENABLED = "LICENSE_PLATE_RECOGNITION_ENABLED"
    CAMERA_FAULTY_SWITCH_ENABLED = "CAMERA_FAULTY_SWITCH_ENABLED"
    SUPPORT_TEAM_DISABLED = "SUPPORT_TEAM_DISABLED"
    NVR_VIDEO_LOG_RETENTION_ENABLED = "NVR_VIDEO_LOG_RETENTION_ENABLED"
    # TODO(@lberg): remove (from DB too), deprecated
    ORG_CONFIG_KVS_STREAM_RETENTION_ENABLED = "ORG_CONFIG_KVS_STREAM_RETENTION_ENABLED"
    SHOW_DETAILED_CAMERA_ERRORS_ENABLED = "SHOW_DETAILED_CAMERA_ERRORS_ENABLED"
    SHOW_CORAM_USERS_IN_ACCESS_LOGS = "SHOW_CORAM_USERS_IN_ACCESS_LOGS"
    ACCESS_CONTROL_ENABLED = "ACCESS_CONTROL_ENABLED"
    DASHBOARD_PAGE_ENABLED = "DASHBOARD_PAGE_ENABLED"
    ENFORCE_PERCEPTION_RETENTION_ENABLED = "ENFORCE_PERCEPTION_RETENTION_ENABLED"
    ENFORCE_THUMBNAILS_RETENTION_ENABLED = "ENFORCE_THUMBNAILS_RETENTION_ENABLED"
    ENFORCE_FACE_OCCURRENCES_RETENTION_ENABLED = (
        "ENFORCE_FACE_OCCURRENCES_RETENTION_ENABLED"
    )
    ENFORCE_MCT_IMAGES_RETENTION_ENABLED = "ENFORCE_MCT_IMAGES_RETENTION_ENABLED"
    ENFORCE_LICENSE_PLATE_DETECTIONS_RETENTION_ENABLED = (
        "ENFORCE_LICENSE_PLATE_DETECTIONS_RETENTION_ENABLED"
    )
    ORG_LICENSED_CAMERAS_CONTROL_ENABLED = "ORG_LICENSED_CAMERAS_CONTROL_ENABLED"
    # TODO(@lberg): remove once mobile clients are updated VAS-3429
    # they are already unused elsewhere
    WALL_ENABLED = "WALL_ENABLED"
    MOBILE_TIMELINE_ENABLED = "MOBILE_TIMELINE_ENABLED"
    ANALYTICS_DASHBOARD_ENABLED = "ANALYTICS_DASHBOARD_ENABLED"
    TRACKING_ANALYTICS_ENABLED = "TRACKING_ANALYTICS_ENABLED"
    DISCOVER_ENABLED = "DISCOVER_ENABLED"
    EDIT_CAMERA_CREDENTIALS_ENABLED = "EDIT_CAMERA_CREDENTIALS_ENABLED"
    ARCHIVE_ENABLED = "ARCHIVE_ENABLED"
    LOC_GROUPS_UX_ENABLED = "LOC_GROUPS_UX_ENABLED"
    MULTI_VIDEO_CONTROLS_ENABLED = "MULTI_VIDEO_CONTROLS_ENABLED"
    PERSON_OF_INTEREST_ENABLED = "PERSON_OF_INTEREST_ENABLED"
    JOURNEY_ENABLED = "JOURNEY_ENABLED"
    LIVE_HD_VIDEO_ENABLED = "LIVE_HD_VIDEO_ENABLED"
    DISCOVERY_V2_ENABLED = "DISCOVERY_V2_ENABLED"
    KIOSK_ENABLED = "KIOSK_ENABLED"
    IOT_CORE_VIDEO_ENABLED = "IOT_CORE_VIDEO_ENABLED"
    NVR_LOCK_SLOTS_EDIT_ENABLED = "NVR_LOCK_SLOTS_EDIT_ENABLED"
    IOT_CORE_DISCOVERY_ENABLED = "IOT_CORE_DISCOVERY_ENABLED"
    IOT_CORE_TEXT_SEARCH_ENABLED = "IOT_CORE_TEXT_SEARCH_ENABLED"
    IOT_CORE_JOURNEY_ENABLED = "IOT_CORE_JOURNEY_ENABLED"
    NVR_UNASSIGN_ENABLED = "NVR_UNASSIGN_ENABLED"
    FACE_UPLOAD_ENABLED = "FACE_UPLOAD_ENABLED"
    GLOBAL_ADMINISTRATION_ENABLED = "GLOBAL_ADMINISTRATION_ENABLED"


class DetectionObjectType(enum.Enum):
    INVALID = "invalid"
    PERSON = "person"
    BICYCLE = "bicycle"
    CAR = "car"
    MOTORCYCLE = "motorcycle"
    AIRPLANE = "airplane"
    BUS = "bus"
    TRAIN = "train"
    TRUCK = "truck"
    BOAT = "boat"
    TRAFFIC_LIGHT = "trafficlight"
    FIRE_HYDRANT = "firehydrant"
    STOP_SIGN = "stopsign"
    PARKING_METER = "parkingmeter"
    BENCH = "bench"
    BIRD = "bird"
    CAT = "cat"
    DOG = "dog"
    HORSE = "horse"
    SHEEP = "sheep"
    COW = "cow"
    ELEPHANT = "elephant"
    BEAR = "bear"
    ZEBRA = "zebra"
    GIRAFFE = "giraffe"
    BACKPACK = "backpack"
    UMBRELLA = "umbrella"
    HANDBAG = "handbag"
    TIE = "tie"
    SUITCASE = "suitcase"
    FRISBEE = "frisbee"
    SKIS = "skis"
    SNOWBOARD = "snowboard"
    SPORTS_BALL = "sportsball"
    KITE = "kite"
    BASEBALL_BAT = "baseballbat"
    BASEBALL_GLOVE = "baseballglove"
    SKATEBOARD = "skateboard"
    SURFBOARD = "surfboard"
    TENNIS_RACKET = "tennisracket"
    BOTTLE = "bottle"
    WINE_GLASS = "wineglass"
    CUP = "cup"
    FORK = "fork"
    KNIFE = "knife"
    SPOON = "spoon"
    BOWL = "bowl"
    BANANA = "banana"
    APPLE = "apple"
    SANDWICH = "sandwich"
    ORANGE = "orange"
    BROCCOLI = "broccoli"
    CARROT = "carrot"
    HOT_DOG = "hotdog"
    PIZZA = "pizza"
    DONUT = "donut"
    CAKE = "cake"
    CHAIR = "chair"
    COUCH = "couch"
    POTTED_PLANT = "pottedplant"
    BED = "bed"
    DINING_TABLE = "diningtable"
    TOILET = "toilet"
    TV = "tv"
    LAPTOP = "laptop"
    MOUSE = "mouse"
    REMOTE = "remote"
    KEYBOARD = "keyboard"
    CELL_PHONE = "cellphone"
    MICROWAVE = "microwave"
    OVEN = "oven"
    TOASTER = "toaster"
    SINK = "sink"
    REFRIGERATOR = "refrigerator"
    BOOK = "book"
    CLOCK = "clock"
    VASE = "vase"
    SCISSORS = "scissors"
    TEDDY_BEAR = "teddybear"
    HAIR_DRIER = "hairdrier"
    TOOTHBRUSH = "toothbrush"
    FAKE_OBJ = "fakeobj"
    MOTION = "motion"


class DetectionObjectTypeCategory(enum.Enum):
    VEHICLE = "vehicle"
    PERSON = "person"
    ANIMAL = "animal"
    MOTION = "motion"
    UNKNOWN = "unknown"


class PerceptionObjectCreate(BaseModel):
    object_type: DetectionObjectType
    # Rectangle properties where x/y corresponds to the width and height
    x_min: float
    y_min: float
    x_max: float
    y_max: float
    # Confidence of the prediction
    confidence: float
    # Whether this detection is moving
    is_moving: bool
    # Track ID
    track_id: int
    # Track age in seconds
    track_age_s: float | None
    # object ID (unique per frame)
    object_idx: int | None
    # This is the legacy version of object_idx.
    # TODO: Remove once we have migrated to object_idx
    idx_in_frame: int | None

    @root_validator
    def validate_object_idx(cls, values: Any) -> Any:
        object_idx = values.get("object_idx")
        idx_in_frame = values.get("idx_in_frame")
        if object_idx is None and idx_in_frame is None:
            raise ValueError("object_idx and idx_in_frame cannot both be None")

        if object_idx is not None and idx_in_frame is not None:
            raise ValueError("object_idx and idx_in_frame cannot both be set")

        return values


class PerceptionObject:
    time: AwareDatetime
    object_type: DetectionObjectType
    # Rectangle properties where x/y correponds to the width and height
    x_min: float
    y_min: float
    x_max: float
    y_max: float

    def __init__(
        self,
        time: AwareDatetime,
        object_type: DetectionObjectType,
        x_min: float,
        y_min: float,
        x_max: float,
        y_max: float,
    ):
        self.time = time
        self.object_type = object_type
        self.x_min = x_min
        self.y_min = y_min
        self.x_max = x_max
        self.y_max = y_max

    def to_shapely_polygon(self) -> Polygon:
        return Polygon(
            (
                (self.x_min, self.y_min),
                (self.x_max, self.y_min),
                (self.x_max, self.y_max),
                (self.x_min, self.y_max),
                (self.x_min, self.y_min),
            )
        )


class PcpObjectIdentifier(BaseModel):
    """PcpObjectIdentifier is a helper class to uniquely identify an object in
    the backend DB and edge FAISS indexes for one camera.
    """

    timestamp: AwareDatetime
    object_idx: int


class TrackIdentifier(BaseModel):
    mac_address: str
    track_id: int
    perception_stack_start_id: str

    def __hash__(self) -> int:
        return hash((type(self),) + tuple(self.__dict__.values()))


class TriggerType(enum.Enum):
    DO_NOT_ENTER = "Do not enter"
    SHORT_STICK_AROUND = "Stick around"
    IDLING = "Idling"


class DayOfWeek(enum.Enum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"

    @classmethod
    def weekday(cls, day: AwareDatetime) -> DayOfWeek:
        weekday_names = list(calendar.day_name)
        key = weekday_names[day.weekday()].lower()
        return cls(key)


class UserAlertTriggerType(BaseModel):
    trigger_type: TriggerType
    min_active_duration_s: int
    max_idle_duration_s: int

    class Config:
        orm_mode = True


class UserAlertSettingBase(BaseModel):
    name: str | None
    camera_mac_address: str
    detection_object_types: set[DetectionObjectType]
    roi_polygon: list[list[float]]
    days_of_week: set[DayOfWeek]
    start_time: AwareTime | None
    end_time: AwareTime | None
    email: str | None
    phone: str | None
    enabled: bool
    creator_name: str | None
    creation_time: AwareDatetime | None
    trigger_type: TriggerType | None
    min_idle_duration_s: int | None

    @root_validator(skip_on_failure=True)
    def validate_start_end_time_tz(cls, values: Any) -> Any:
        start_time = values.get("start_time")
        end_time = values.get("end_time")
        if start_time is None or end_time is None:
            return values

        if start_time.tzinfo != end_time.tzinfo:
            raise ValueError("start_time and end_time must have the same timezone")

        return values

    def is_activated(self, query_time: AwareDatetime) -> bool:
        """
        Check if the alert setting is activated at the given time.
        NOTE(@lberg): In all computations here we must ensure we first
        set the same timezone of the alert
        """

        if self.start_time is None or self.end_time is None:
            return False

        query_time_in_alert_tz = query_time.astimezone(self.start_time.tzinfo)

        time_query_time = query_time_in_alert_tz.timetz()

        # activate when start_time < end_time
        within_range = (
            time_query_time >= self.start_time and time_query_time <= self.end_time
        )
        # activate when end_time < start_time (e.g. 11pm to 2am)
        # To capture midnight, we will check the complement of the range
        # so this will be active from 11pm to 11:59pm and 12:00am to 2am
        # NOTE(@lberg): this is the same day for both intervals
        within_range_complement = not (
            time_query_time >= self.end_time and time_query_time <= self.start_time
        )
        activated_with_time = (
            within_range
            if self.end_time >= self.start_time
            else within_range_complement
        )

        weekday = DayOfWeek.weekday(query_time)
        activated_with_weekday = (
            self.days_of_week is not None and weekday in self.days_of_week
        )
        return activated_with_time and activated_with_weekday


class UserAlertSettingCreate(UserAlertSettingBase):
    pass


class UserAlertSetting(UserAlertSettingBase):
    id: int

    class Config:
        orm_mode = True


class UserAlertBase(BaseModel):
    setting_id: int
    start_time: AwareDatetime
    end_time: AwareDatetime
    is_active: bool
    alert_sent_time: AwareDatetime | None = None


class UserAlertCreate(UserAlertBase):
    pass


class UserAlert(UserAlertBase):
    id: int

    class Config:
        orm_mode = True


class UserAlertSettingsInfoFromActiveAlert(BaseModel):
    setting_ids: set[int]
    tenant: str


class ThumbnailType(enum.Enum):
    THUMBNAIL = "thumbnail"
    TIMELAPSE = "timelapse"


class ThumbnailCreate(BaseModel):
    timestamp: AwareDatetime
    camera_mac_address: str
    s3_path: S3Path
    thumbnail_type: ThumbnailType


class RegisterThumbnailsRequest(BaseModel):
    thumbnails: list[ThumbnailCreate] = Field(max_items=250)


# TODO(@lberg): this is only temporary, we will remove the primary key
@pyd_dataclass(eq=True, frozen=True)
class MctImageKey:
    camera_mac_address: str
    timestamp: AwareDatetime
    track_id: int


class MctImageCreate(BaseModel):
    camera_mac_address: str
    timestamp: AwareDatetime
    track_id: int
    perception_stack_start_id: str
    s3_path: S3Path


class MctImage(MctImageCreate):
    class Config:
        orm_mode = True


class RegisterMctImagesRequest(BaseModel):
    mct_images: list[MctImageCreate] = Field(max_items=250)


class TextSearchResponseCreate(BaseModel):
    request_id: int
    nvr_uuid: str
    # TODO(@lberg): this should have a lists of models,
    # that way we don't have to check everywhere for the same length
    # TODO (@slava @Yawei Ye): at the moment we request top_k * 100 from the edge,
    # so each time we request 2500 results.
    ranked_timestamps: list[AwareDatetime] = Field(max_items=5000)
    scores: list[float] = Field(max_items=5000)
    mac_addresses: list[str] = Field(max_items=5000)
    ranked_object_ids: list[int] = Field(max_items=5000)

    @root_validator
    def validate_lists(cls, values: Any) -> Any:
        ranked_timestamps = values.get("ranked_timestamps")
        scores = values.get("scores")
        mac_addresses = values.get("mac_addresses")
        ranked_object_ids = values.get("ranked_object_ids")
        if ranked_timestamps is None or scores is None or mac_addresses is None:
            raise ValueError("ranked_timestamps/scores/mac_addresses must be specified")
        # validate that the length of the lists are the same
        list_lengths = [
            len(ranked_timestamps),
            len(scores),
            len(mac_addresses),
            len(ranked_object_ids),
        ]
        if len(set(list_lengths)) != 1:
            raise ValueError(
                "ranked_timestamps/scores/mac_addresses must have the same length"
            )

        return values


class WallTileCreate(BaseModel):
    wall_id: int
    camera_mac_address: str | None
    x_start_tile: int
    y_start_tile: int
    width_tiles: int
    height_tiles: int

    @classmethod
    def from_wall_tile(cls, wall_tile: WallTile) -> WallTileCreate:
        return WallTileCreate(
            wall_id=wall_tile.wall_id,
            camera_mac_address=wall_tile.camera_mac_address,
            x_start_tile=wall_tile.x_start_tile,
            y_start_tile=wall_tile.y_start_tile,
            width_tiles=wall_tile.width_tiles,
            height_tiles=wall_tile.height_tiles,
        )


class WallTile(WallTileCreate):
    id: int

    class Config:
        orm_mode = True


class WallCreate(BaseModel):
    owner_user_email: str
    name: str


class Wall(WallCreate):
    id: int

    class Config:
        orm_mode = True


class SharedWallCreate(BaseModel):
    wall_id: int
    shared_with_user_email: str


class SharedWall(SharedWallCreate):
    class Config:
        orm_mode = True


class UpdateCameraCredentialsRequest(BaseModel):
    mac_address: str
    username: str | None
    should_update_username: bool
    password: str | None
    should_update_password: bool


class CameraCredentials(BaseModel):
    username: str | None
    password: str | None
    vendor: str

    class Config:
        orm_mode = True


class UpdateCameraVideoOrientationType(BaseModel):
    mac_address: str
    video_orientation_type: VideoOrientationType


class UpdateCameraRtspUrlRequest(BaseModel):
    mac_address: str
    rtsp_url: str | None


# This enum represents flags that can be set for a camera
class CameraFlag(str, enum.Enum):
    # Note that the enum values are the column names in the database
    IS_ALWAYS_STREAMING = "is_always_streaming"
    IS_LPR_ENABLED = "is_license_plate_detection_enabled"
    IS_AUDIO_ENABLED = "is_audio_enabled"
    IS_FAULTY = "is_faulty"
    WEBRTC_ENABLED = "is_webrtc_enabled"
    IS_FORCE_FPS_ENABLED = "is_force_fps_enabled"


class UpdateCameraFlag(BaseModel):
    mac_address: str
    flag_enum: CameraFlag
    flag_value: bool


class UpdateCamerasWebrtcFlag(BaseModel):
    mac_addresses: list[str]
    flag_value: bool


class SharedArchiveBase(BaseModel):
    archive_id: int
    user_email: EmailStr


class SharedArchiveCreate(SharedArchiveBase):
    pass


class SharedArchive(SharedArchiveBase):
    class Config:
        orm_mode = True


class ClipDataBase(BaseModel):
    mac_address: str
    start_time: AwareDatetime
    end_time: AwareDatetime
    creation_time: AwareDatetime
    kvs_stream_name: str | None = None
    s3_path: S3Path | None = None
    expiration_time: AwareDatetime | None = None


class ClipDataCreate(ClipDataBase):
    pass


class ClipData(ClipDataBase):
    id: int

    class Config:
        orm_mode = True


class SharedVideoBase(BaseModel):
    email_address: EmailStr | None = None
    phone_number: str | None = None
    user_name: str
    expiration_time: AwareDatetime


class SharedVideoCreate(SharedVideoBase):
    clip_id: int


class SharedVideo(SharedVideoBase):
    unique_hash: str
    clip: ClipData

    class Config:
        orm_mode = True


class ArchiveComment(BaseModel):
    id: int
    user_email: EmailStr
    comment: str
    creation_time: AwareDatetime

    class Config:
        orm_mode = True


class ArchiveBase(BaseModel):
    owner_user_email: EmailStr
    creation_time: AwareDatetime
    title: str
    description: str


class ArchiveCreate(ArchiveBase):
    tags: list[int]


class ArchiveClipData(BaseModel):
    clip_id: int
    archive_id: int
    clip_creator_email: EmailStr
    clip: ClipData
    creation_time: AwareDatetime

    class Config:
        orm_mode = True


class Archive(ArchiveBase):
    id: int
    clips: list[ArchiveClipData]
    share_infos: list[SharedArchive]
    comments: list[ArchiveComment]

    class Config:
        orm_mode = True


class HlsSessionInfo(BaseModel):
    token: str
    stream_name: str
    start_time: AwareDatetime
    end_time: AwareDatetime


class NotificationGroupMemberBase(BaseModel):
    user_name: str | None = None
    email_address: EmailStr | None = None
    phone_number: str | None = None

    @validator("phone_number")
    def validate_phone_number(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        return validate_phone_number(v)


class NotificationGroupMemberUpdate(NotificationGroupMemberBase):
    pass


class NotificationGroupMemberCreate(NotificationGroupMemberBase):
    group_id: int


class NotificationGroupMember(NotificationGroupMemberBase):
    id: int
    group_id: int

    class Config:
        orm_mode = True


class NotificationGroupBase(BaseModel):
    name: str


class NotificationGroup(NotificationGroupBase):
    id: int
    members: list[NotificationGroupMember]

    class Config:
        orm_mode = True


class LicensePlateAlertProfileCreate(BaseModel):
    owner_user_email: EmailStr
    creation_time: AwareDatetime
    license_plate_number: str
    # Add information to show a preview of the license plate
    image_s3_path: S3Path
    x_min: float
    y_min: float
    x_max: float
    y_max: float


# Base class for returning alert profile from DB
class AlertProfileBase(BaseModel):
    id: int
    owner_user_email: EmailStr
    creation_time: AwareDatetime
    notification_groups: List[NotificationGroup]

    def get_all_members_to_notify(self) -> List[NotificationGroupMember]:
        members = []
        for group in self.notification_groups:
            members.extend(group.members)
        return members


class LicensePlateAlertProfile(AlertProfileBase):
    license_plate_number: str
    # Add information to show a preview of the license plate
    image_s3_path: S3Path
    x_min: float
    y_min: float
    x_max: float
    y_max: float

    class Config:
        orm_mode = True


class LicensePlate(BaseModel):
    license_plate_number: str

    class Config:
        orm_mode = True


class LicensePlateEvent(BaseModel):
    license_plate_number: str
    mac_address: str
    time: AwareDatetime

    class Config:
        orm_mode = True


class LicensePlateDetectionCreate(LicensePlateEvent):
    score: float
    dscore: float
    vscore: float
    x_min: float
    y_min: float
    x_max: float
    y_max: float
    track_id: int
    object_id: int
    perception_stack_start_id: str
    image_s3_path: S3Path


class LicensePlateDetection(LicensePlateDetectionCreate):
    # TODO(yawei): remove this after migration
    license_plate: str


class LicensePlateTrackInfo(BaseModel):
    license_plate_number: str
    camera_mac_address: str
    last_seen: AwareDatetime
    num_occurrences: int
    x_min: float
    y_min: float
    x_max: float
    y_max: float
    image_s3_path: S3Path
    camera_name: str
    location_name: str | None
    alert_profile: LicensePlateAlertProfile | None

    class Config:
        orm_mode = True


class FaceAlertProfileCreate(BaseModel):
    owner_user_email: EmailStr
    creation_time: AwareDatetime
    description: str | None
    is_person_of_interest: bool
    org_unique_face_id: int


class FaceAlertProfile(AlertProfileBase):
    org_unique_face: OrgUniqueFace
    description: str | None
    is_person_of_interest: bool

    class Config:
        orm_mode = True


class FaceAlertProfileIdentifier(BaseModel):
    alert_profile_id: int

    def __hash__(self) -> int:
        return hash((type(self),) + tuple(self.__dict__.values()))


class BackendState(BaseModel):
    last_seen_time: AwareDatetime


# Rectangle defined as min and max coords
# NOTE(@lberg): coords are normalized in [0,1]
class SearchAreaRectangle(BaseModel):
    coord_min: Point2D
    coord_max: Point2D

    def to_shapely_polygon(self) -> Polygon:
        return Polygon(
            (
                (self.coord_min.x, self.coord_min.y),
                (self.coord_max.x, self.coord_min.y),
                (self.coord_max.x, self.coord_max.y),
                (self.coord_min.x, self.coord_max.y),
            )
        )


# Convex Poly defined as multiple points
# NOTE(@lberg): coords are normalized in [0,1]
class SearchAreaConvexPoly(BaseModel):
    coords: list[Point2D]

    def to_shapely_polygon(self) -> Polygon:
        if len(self.coords) < 3:
            raise ValueError("Polygon must have at least 3 points")
        # create a polygon by adding the end point to be the same as the start point.
        search_region_close = self.coords.copy()
        search_region_close.append(self.coords[0])
        search_area_pts = ((pt.x, pt.y) for pt in search_region_close)
        return Polygon(search_area_pts)


MAX_EMBEDDING_DIM = 8192
VALID_EMBEDDING_DIMS = [512, 768]


class EmbeddingResponseCreate(BaseModel):
    # The corresponding Journey request ID
    request_id: int
    # The embedding which could be empty if no match found
    embedding: list[float] | None = Field(max_items=MAX_EMBEDDING_DIM)
    # The version of the model used to generate the embedding, which could be empty
    # if no match found
    clip_version: str | None = None

    @validator("embedding")
    def validate_embedding(cls, v: list[float]) -> list[float]:
        if v is not None and len(v) not in VALID_EMBEDDING_DIMS:
            raise ValueError("Invalid embedding length")
        return v

    # Validate that the clip version is None if the embedding is not found and
    # we do not validate the clip version if the embedding is found for backward
    # compatibility
    # TODO(VAS-3842): update this once we have migrated to the new clip version
    @root_validator
    def validate_clip_version_with_embedding_legacy(
        cls, values: dict[str, Any]
    ) -> dict[str, Any]:
        embedding = values.get("embedding")
        clip_version = values.get("clip_version")

        if embedding is None and clip_version is not None:
            raise ValueError("Clip version should be None if embedding is not found")
        return values


class EmbeddingResponse(EmbeddingResponseCreate):
    class Config:
        orm_mode = True


class JourneyCameraResult(BaseModel):
    mac_address: str
    timestamp: AwareDatetime
    object_index: int
    score: float


class JourneyResponseCreate(BaseModel):
    request_id: int
    nvr_uuid: str
    # NOTE(@lberg): 100 here is estimated to be the max number of cameras
    # for a given NVR.
    camera_results: list[JourneyCameraResult] = Field(
        max_items=JOURNEY_REQUEST_TOP_K * JOURNEY_REQUEST_TOP_K_MULTIPLE * 100
    )


class JourneyRequestStatus(enum.Enum):
    INVALID = "invalid"
    PENDING = "pending"
    NO_EMBEDDING = "no_embedding"
    SUCCESS = "success"


class KioskCreate(BaseModel):
    creator_user_email: str
    name: str
    rotate_frequency_s: float
    is_enabled: bool


class KioskWall(BaseModel):
    kiosk_id: int
    index: int
    wall: Wall

    class Config:
        orm_mode = True


class Kiosk(KioskCreate):
    id: int
    hash: str
    # Note that the order of the walls in the list is the order in which they
    # will be displayed on the kiosk.
    walls: list[Wall]
    tenant: str

    @root_validator(pre=True)
    def convert_kiosk_walls_to_walls(cls, values: dict[str, Any]) -> dict[str, Any]:
        # This case is when we are sending a Kiosk object as a response
        if "kiosk_walls" not in values:
            return values

        # This case is when we are creating a Kiosk object from orm.Kiosk that
        # has kioks_walls.
        kiosk_walls = values.get("kiosk_walls", [])
        # Sort the walls by index first
        kiosk_walls = sorted(kiosk_walls, key=lambda kiosk_wall: kiosk_wall.index)
        return {**values, "walls": [kiosk_wall.wall for kiosk_wall in kiosk_walls]}

    class Config:
        orm_mode = True


class AccessLog(BaseModel):
    timestamp: datetime
    action: UserActions
    user_email: str
    ip_address: str
    details: dict[str, str] | None

    class Config:
        orm_mode = True


class ArchiveThumbnailCreate(BaseModel):
    timestamp: AwareDatetime
    s3_path: S3Path


class CameraRetentionInfo(BaseModel):
    mac_address: str
    retention_days: int
    tenant: str
    resource_name: str = ""

    @property
    def retention_days_string(self) -> str:
        return f"{self.retention_days} days"


class ResourceRetentionData(BaseModel):
    # NOTE(@lberg): this is a list because we might have multiple images per resource
    s3_paths: list[S3Path]
    timestamp: AwareDatetime


class CamerasQueryConfig(BaseModel):
    nvr_uuids: set[str] | None = None
    mac_addresses: set[str] | None = None
    location_ids: set[int] | None = None

    exclude_disabled: bool = False
    online_threshold: timedelta = CAMERA_ONLINE_TIMEOUT


class NvrsQueryConfig(BaseModel):
    location_id: int | None = None
    uuids: set[str] | None = None
    include_without_location: bool = False


class TextSearchNVRsFeedback(BaseModel):
    expected_nvr_uuids: set[str]
    responded_nvr_uuids: set[str]

    @property
    def all_nvrs_have_responded(self) -> bool:
        return self.expected_nvr_uuids == self.responded_nvr_uuids


class NVRSlotsLock(BaseModel):
    action: Literal["lock"] = "lock"
    nvr_uuid: str
    num_slots: int


class NVRSlotsUnlock(BaseModel):
    action: Literal["unlock"] = "unlock"
    nvr_uuid: str


NVRSlotsAction = Annotated[
    Union[NVRSlotsLock, NVRSlotsUnlock], Field(discriminator="action")
]
