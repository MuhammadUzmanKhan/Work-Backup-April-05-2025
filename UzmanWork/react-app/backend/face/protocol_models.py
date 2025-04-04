from pydantic import BaseModel

from backend.face.models import TrackEmbeddingData
from backend.s3_utils import S3Path


# TODO(@lberg): remove once NVRs are updated
class RequiredUniqueFaceEdgeData(BaseModel):
    unique_face_id: str
    s3_path: S3Path
    track_embedding_data: TrackEmbeddingData


class UniqueFaceShareBody(BaseModel):
    sender_nvr_uuid: str
    unique_face_data: RequiredUniqueFaceEdgeData
