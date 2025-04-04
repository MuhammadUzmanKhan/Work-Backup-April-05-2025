from enum import Enum, auto
from typing import Annotated, Literal, Union

from pydantic import BaseModel, Field, HttpUrl

from backend.database.face_models import (
    FaceOccurrence,
    FaceOccurrenceCreate,
    UniqueFaceOccurrence,
)
from backend.models import AccessRestrictions
from backend.s3_utils import S3Path
from backend.utils import AwareDatetime


class FaceEmbeddingData(BaseModel):
    embedding: list[float]
    face_quality_score: float
    face_quality_score_version: int
    # TODO: Remove optional when all NVRs are updated
    occurrence_time: AwareDatetime | None = None


class TrackEmbeddingData(BaseModel):
    track_embeddings: list[FaceEmbeddingData]


class UniqueFaceEdgeData(BaseModel):
    unique_face_id: str
    s3_path: S3Path
    # TODO(@lberg): this is for backwards compatibility
    # Remove optional when all NVRs are updated
    track_embedding_data: TrackEmbeddingData | None = None


class RegisterFacesRequest(BaseModel):
    new_unique_faces: list[UniqueFaceEdgeData] = Field(default=[], max_items=250)
    new_face_occurrences: list[FaceOccurrenceCreate] = Field(default=[], max_items=250)

    def to_check_ufi(self) -> set[str]:
        # Get the set of unique face IDs that need to be checked against the DB.
        # These are associated to the face occurrences we want to insert, but they
        # are not part of the unique faces we are planning to insert.
        new_ufi = {face.unique_face_id for face in self.new_unique_faces}
        to_be_queried_ufi = {fo.nvr_unique_face_id for fo in self.new_face_occurrences}
        return to_be_queried_ufi - new_ufi


class RegisterFacesResponse(BaseModel):
    missing_unique_face_ids: set[str]


class UniqueFacesRequest(BaseModel):
    start_time: AwareDatetime
    end_time: AwareDatetime
    mac_addresses: set[str] = set()
    location_ids: set[int] = set()


class FaceOccurrencesRequest(BaseModel):
    start_time: AwareDatetime
    end_time: AwareDatetime
    org_unique_face_id: int
    mac_addresses: set[str] = set()
    location_ids: set[int] = set()


class UniqueFaceResponse(UniqueFaceOccurrence):
    s3_signed_url: HttpUrl


class FaceOccurrenceResponse(FaceOccurrence):
    person_s3_signed_url: HttpUrl | None


class NVRUniqueFacesMergeRequest(BaseModel):
    # This unique id should be merged
    nvr_unique_face_id_merge_src: str
    # With this unique id
    nvr_unique_face_id_merge_dst: str


class FaceOccurrenceRequest(BaseModel):
    id: int


class NVRUniqueFaceNotificationData(BaseModel):
    recipient_nvr_uuids: list[str]
    sender_nvr_uuid: str
    unique_faces: list[UniqueFaceEdgeData]


class FaceUploadProcessData(BaseModel):
    tenant: str
    access_restrictions: AccessRestrictions
    face_s3_path: S3Path
    org_unique_face_id: int


class NVRFaceImageProcessRequest(BaseModel):
    signed_url: str
    org_unique_face_id: int


class FaceImageProcessError(str, Enum):
    FAILED_TO_DOWNLOAD_FACE_IMAGE = auto()
    FAILED_TO_DECODE_FACE_IMAGE = auto()
    NO_FACES_DETECTED = auto()
    FAILED_TO_UPLOAD_FACE_IMAGE = auto()

    def __str__(self) -> str:
        return self.name


class FaceImageProcessInfo(str, Enum):
    MULTIPLE_FACES_DETECTED = auto()
    NO_FACES_PASSED_QUALITY_FILTER = auto()
    MULTIPLE_FACES_PASSED_QUALITY_FILTER = auto()
    FACE_CANNOT_BE_ANCHOR_FACE = auto()
    FACE_MATCHED_EXISTING_FACE = auto()

    def __str__(self) -> str:
        return self.name


class NVRFaceImageProcessedNewFaceData(BaseModel):
    event: Literal["new_face"] = "new_face"
    unique_face: UniqueFaceEdgeData
    infos: list[FaceImageProcessInfo]


class NVRFaceImageProcessedExistingFaceData(BaseModel):
    event: Literal["existing_face"] = "existing_face"
    nvr_unique_face_id_merge_src: str
    infos: list[FaceImageProcessInfo]


class NVRFaceImageProcessedNoFaceData(BaseModel):
    event: Literal["no_face"] = "no_face"
    error: FaceImageProcessError


NVRFaceImageProcessedData = Annotated[
    Union[
        NVRFaceImageProcessedNewFaceData,
        NVRFaceImageProcessedExistingFaceData,
        NVRFaceImageProcessedNoFaceData,
    ],
    Field(discriminator="event"),
]


class NVRFaceImageProcessedRequest(BaseModel):
    data: NVRFaceImageProcessedData
    org_unique_face_id: int
