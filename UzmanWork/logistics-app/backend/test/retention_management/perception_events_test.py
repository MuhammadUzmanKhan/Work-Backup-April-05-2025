import pytest
import sqlalchemy as sa

from backend.database import database, orm
from backend.database.models import NVR, Camera, CameraGroup
from backend.database.orm.orm_camera import generate_perception_partition_table_name
from backend.retention_management.exceptions import RetentionTaskError
from backend.retention_management.perception_events import (
    enforce_perception_cameras_partition_retention,
)
from backend.test.factory_types import CameraFactory


async def add_camera_to_part_config(
    db_instance: database.Database, camera: Camera, retention_days: int = 1
) -> None:
    async with db_instance.session() as session:
        partition_table_name = generate_perception_partition_table_name(
            camera.mac_address
        )
        # just add the entry in the partman config table
        await session.execute(
            sa.text(
                "INSERT INTO partman.part_config (parent_table, retention) VALUES"
                " (:parent_table_name, :retention)"
            ).bindparams(
                sa.bindparam("parent_table_name", partition_table_name),
                sa.bindparam("retention", f"{retention_days} days"),
            )
        )


async def test_enforce_perception_cameras_partition_retention_no_cameras(
    db_instance: database.Database,
) -> None:
    with pytest.raises(RetentionTaskError):
        await enforce_perception_cameras_partition_retention(db_instance)


async def test_enforce_perception_cameras_partition_retention_missing_camera_part(
    db_instance: database.Database,
    mocked_part_config: None,
    nvr: NVR,
    camera_group: CameraGroup,
    create_camera: CameraFactory,
) -> None:
    for _ in range(5):
        camera = await create_camera(camera_group.id, nvr.uuid)
        await add_camera_to_part_config(db_instance, camera)
    # add a camera that is not in the partman config
    await create_camera(camera_group.id, nvr.uuid)
    errors = await enforce_perception_cameras_partition_retention(db_instance)
    # the camera should just be skipped
    assert len(errors) == 0


async def test_enforce_perception_cameras_partition_retention(
    db_instance: database.Database,
    mocked_part_config: None,
    nvr: NVR,
    camera_group: CameraGroup,
    create_camera: CameraFactory,
) -> None:
    num_cameras = 5
    # add cameras with one retention
    for _ in range(num_cameras):
        camera = await create_camera(camera_group.id, nvr.uuid)
        await add_camera_to_part_config(db_instance, camera, retention_days=1)
    # set a new retention for the NVR
    new_retention_days = 2
    async with db_instance.session() as session:
        await orm.NVR.system_update_nvr_retention(session, nvr.uuid, new_retention_days)
    errors = await enforce_perception_cameras_partition_retention(db_instance)
    assert len(errors) == 0

    # expect all cameras to have the new retention
    async with db_instance.session() as session:
        results = (
            await session.execute(
                sa.text(
                    "select retention, retention_keep_table from partman.part_config "
                )
            )
        ).all()

        assert len(results) == num_cameras
        for result in results:
            assert result.retention == f"{new_retention_days} days"
            assert result.retention_keep_table is False
