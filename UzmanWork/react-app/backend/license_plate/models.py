from typing import Any

from pydantic import BaseModel, HttpUrl, validator

from backend.database.models import LicensePlateEvent, LicensePlateTrackInfo
from backend.s3_utils import S3Path
from backend.utils import AwareDatetime
from backend.validators import validate_end_time_after_start


class RegisterLicensePlateRequest(BaseModel):
    timestamp: AwareDatetime
    mac_address: str
    perception_stack_start_id: str
    object_id: int
    track_id: int
    image_s3_path: S3Path


class LicensePlatesRequest(BaseModel):
    start_time: AwareDatetime
    end_time: AwareDatetime
    mac_addresses: set[str]
    location_ids: set[int]
    include_license_plates_of_interest_only: bool = False

    @validator("end_time")
    def end_time_validate(
        cls, end_time: AwareDatetime, values: dict[str, Any], **kwargs: Any
    ) -> AwareDatetime:
        return validate_end_time_after_start(end_time, values)


class LicensePlateResponse(BaseModel):
    license_plate: LicensePlateTrackInfo
    s3_signed_url: HttpUrl


class LicensePlateOccurrencesRequest(BaseModel):
    start_time: AwareDatetime
    end_time: AwareDatetime
    license_plate_number: str
    mac_addresses: set[str]
    location_ids: set[int]

    @validator("end_time")
    def end_time_validate(
        cls, end_time: AwareDatetime, values: dict[str, Any], **kwargs: Any
    ) -> AwareDatetime:
        return validate_end_time_after_start(end_time, values)


class LicensePlateOccurrencesResponse(BaseModel):
    license_plate: LicensePlateEvent


class Box(BaseModel):
    xmin: float
    ymin: float
    xmax: float
    ymax: float


class Vehicle(BaseModel):
    type: str
    score: float
    box: Box


class PlateDetectionResult(BaseModel):
    plate: str
    score: float
    dscore: float
    box: Box
    vehicle: Vehicle


class PlateRecognizerResponse(BaseModel):
    results: list[PlateDetectionResult]


class LicensePlateDetectionError(Exception):
    pass


class LicensePlateAlertError(Exception):
    pass
