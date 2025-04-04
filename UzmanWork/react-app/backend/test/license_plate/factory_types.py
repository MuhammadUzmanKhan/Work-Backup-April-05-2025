from typing import Protocol

from backend.license_plate.models import (
    PlateDetectionResult,
    RegisterLicensePlateRequest,
)
from backend.utils import AwareDatetime


class LicensePlateDetectionResultFactory(Protocol):
    def __call__(
        self,
        license_plate: str | None = None,
        score: float = 0.9,
        dscore: float = 0.9,
        vscore: float = 0.9,
    ) -> PlateDetectionResult: ...


class RegisterLicensePlateRequestFactory(Protocol):
    def __call__(
        self,
        object_id: int,
        track_id: int,
        perception_stack_start_id: str,
        mac_address: str,
        time: AwareDatetime | None = None,
        image_s3_path: str | None = None,
    ) -> RegisterLicensePlateRequest: ...
