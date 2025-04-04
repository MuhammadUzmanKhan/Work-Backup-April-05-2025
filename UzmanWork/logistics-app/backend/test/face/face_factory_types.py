from typing import Protocol

from backend.face.models import RegisterFacesRequest
from backend.utils import AwareDatetime


class RegisterFacesRequestFactory(Protocol):
    def __call__(
        self,
        mac_address: str,
        unique_face_id: str | None = None,
        s3_url: str | None = None,
        occurrence_time: AwareDatetime | None = None,
        with_track_embedding_data: bool = False,
    ) -> RegisterFacesRequest: ...
