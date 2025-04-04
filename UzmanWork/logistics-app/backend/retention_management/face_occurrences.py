from backend.boto_utils import BotoSessionFn
from backend.database import database, orm
from backend.retention_management.constants import (
    PER_CAMERA_DELETE_LIMIT_FACE_OCCURRENCES,
)
from backend.retention_management.exceptions import ResourceDeleteError
from backend.retention_management.utils import enforce_resource_retention
from backend.utils import AwareDatetime


async def enforce_face_occurrences_retention(
    db: database.Database,
    boto_session_maker: BotoSessionFn,
    time_now: AwareDatetime,
    per_camera_delete_limit: int = PER_CAMERA_DELETE_LIMIT_FACE_OCCURRENCES,
) -> list[ResourceDeleteError]:
    return await enforce_resource_retention(
        db,
        "face_occurrences",
        boto_session_maker,
        orm.FaceOccurrence.system_get_retention_data_for_camera,
        orm.FaceOccurrence.delete_in_range_for_camera,
        time_now=time_now,
        per_camera_delete_limit=per_camera_delete_limit,
    )
