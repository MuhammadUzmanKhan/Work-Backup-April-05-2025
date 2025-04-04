from backend.boto_utils import BotoSessionFn
from backend.database import database, orm
from backend.retention_management.constants import PER_CAMERA_DELETE_LIMIT_MCT_IMAGES
from backend.retention_management.exceptions import ResourceDeleteError
from backend.retention_management.utils import enforce_resource_retention
from backend.utils import AwareDatetime


async def enforce_mct_images_retention(
    db: database.Database,
    boto_session_maker: BotoSessionFn,
    time_now: AwareDatetime,
    per_camera_delete_limit: int = PER_CAMERA_DELETE_LIMIT_MCT_IMAGES,
) -> list[ResourceDeleteError]:
    return await enforce_resource_retention(
        db,
        "mct_images",
        boto_session_maker,
        orm.MctImage.system_get_retention_data_for_camera,
        orm.MctImage.system_delete_in_range_for_camera,
        per_camera_delete_limit=per_camera_delete_limit,
        time_now=time_now,
    )
