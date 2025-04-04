from typing import Any

import pydantic
from pydantic import BaseModel

from backend.s3_utils import S3Path
from backend.utils import AwareDatetime


class OrgUniqueFace(BaseModel):
    id: int
    s3_path: S3Path

    class Config:
        orm_mode = True


class NVRUniqueFaceBase(BaseModel):
    nvr_unique_face_id: str
    s3_path: S3Path


class NVRUniqueFaceCreate(NVRUniqueFaceBase):
    # TODO(@lberg): remove once the update the NVR
    # NOTE(@lberg): this can't be on the Base because it should not run
    # for model with from_orm true (we don't get a dict in that case)
    @pydantic.root_validator(pre=True)
    def backward_compatible_nvr_unique_face_id(
        cls, values: dict[str, Any]
    ) -> dict[str, Any]:
        """Patch the unique_face_id to nvr_unique_face_id if it's not present.
        This is so we don't need to change core or set the field to nullable.
        """
        if "nvr_unique_face_id" not in values:
            if "unique_face_id" not in values:
                raise ValueError(
                    "either nvr_unique_face_id or unique_face_id must be specified"
                )
            values["nvr_unique_face_id"] = values["unique_face_id"]
        return values


class NVRUniqueFace(NVRUniqueFaceBase):
    nvr_uuid: str
    org_unique_face_id: int

    class Config:
        orm_mode = True


class UniqueFaceOccurrence(BaseModel):
    org_unique_face_id: int
    s3_path: S3Path
    occurrence_time: AwareDatetime
    mac_address: str

    class Config:
        orm_mode = True


class OrgUniqueFaceIdentifier(BaseModel):
    org_unique_face_id: int

    def __hash__(self) -> int:
        return hash((type(self),) + tuple(self.__dict__.values()))


class FaceOccurrenceBase(BaseModel):
    nvr_unique_face_id: str
    camera_mac_address: str
    occurrence_time: AwareDatetime
    # The index of the object in a given frame, together with the timestamp
    # uniquely identifies a detection. This is None if this face was not
    # associated to a track. Note that this is not the index of the face in the
    # frame, but the index of the (person) detection in the frame.
    pcp_idx_in_frame: int | None = None
    face_s3_path: S3Path | None = None
    person_s3_path: S3Path | None = None
    # The sharpness score of the face image (non-negative). The higher the
    # score, the sharper.
    face_sharpness: float = 0.0


class FaceOccurrenceCreate(FaceOccurrenceBase):
    # TODO(@lberg): remove once the update the NVR
    # NOTE(@lberg): this can't be on the Base because it should not run
    # for model with from_orm true (we don't get a dict in that case)
    @pydantic.root_validator(pre=True)
    def backward_compatible_nvr_unique_face_id(
        cls, values: dict[str, Any]
    ) -> dict[str, Any]:
        """Patch the unique_face_id to nvr_unique_face_id if it's not present.
        This is so we don't need to change core or set the field to nullable.
        """
        if "nvr_unique_face_id" not in values:
            if "unique_face_id" not in values:
                raise ValueError(
                    "either nvr_unique_face_id or unique_face_id must be specified"
                )
            values["nvr_unique_face_id"] = values["unique_face_id"]
        return values


class FaceOccurrence(FaceOccurrenceBase):
    id: int
    org_unique_face_id: int

    class Config:
        orm_mode = True


class NVRUniqueFaceFromUploadCreate(BaseModel):
    nvr_unique_face_id: str
    s3_path: S3Path
    org_unique_face_id: int


class OrgUniqueFacesMerge(BaseModel):
    org_unique_face_id_src: int
    org_unique_face_id_dst: int

    @property
    def is_same_face(self) -> bool:
        return self.org_unique_face_id_src == self.org_unique_face_id_dst
