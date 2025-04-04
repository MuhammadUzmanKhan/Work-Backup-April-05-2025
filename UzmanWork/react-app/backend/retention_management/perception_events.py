from sqlalchemy import exc

from backend.database import database, orm
from backend.retention_management.exceptions import (
    PerceptionRetentionUpdateError,
    RetentionTaskError,
)
from backend.retention_management.utils import retention_logger


async def enforce_perception_cameras_partition_retention(
    db: database.Database,
) -> list[PerceptionRetentionUpdateError]:
    """Enforce all perception cameras partitions to have the correct retention
    Based on the one in the DB at this moment.
    """
    async with db.session() as session:
        cameras_info = await orm.Camera.system_cameras_retention_info(session)
    if not cameras_info:
        raise RetentionTaskError(
            "No cameras found for perception retention update. This is unexpected."
        )
    retention_logger.info(
        f"Got {len(cameras_info)} cameras for perception retention update"
    )
    # retention policy is set in partman config, which is not mapped to an ORM model
    # as such, we need to do a raw query here
    errors = []
    for camera_info in cameras_info:
        async with db.session() as session:
            try:
                has_part = await orm.Camera.system_camera_has_part_config(
                    session, camera_info
                )
                if not has_part:
                    retention_logger.warn(
                        f"Camera {camera_info} does not have a partition config,"
                        " skipping."
                    )
                    continue
                updated_rows = (
                    await orm.Camera.system_update_camera_part_config_retention(
                        session, camera_info
                    )
                )
                if updated_rows != 1:
                    errors.append(
                        PerceptionRetentionUpdateError(
                            f"Unexpected {updated_rows=} for {camera_info=}"
                        )
                    )
            except exc.SQLAlchemyError as e:
                errors.append(
                    PerceptionRetentionUpdateError(
                        f"Failed to update retention for {camera_info=}: {e}"
                    )
                )
    return errors
