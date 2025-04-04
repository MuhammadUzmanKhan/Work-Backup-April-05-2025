from datetime import timedelta
from unittest.mock import MagicMock

from backend.database import database, orm
from backend.database.models import NVR, Camera, ResourceRetentionData
from backend.retention_management.thumbnails import enforce_thumbnails_retention
from backend.test.factory_types import ThumbnailFactory
from backend.test.retention_management.utils import (
    TIME_NOW_RETENTION_TESTS,
    CreateConfig,
    ExpectedResources,
    create_retention_resources,
    verify_deleted_resources,
)
from backend.utils import AwareDatetime


async def test_enforce_thumbnails_retention(
    db_instance: database.Database,
    camera: Camera,
    nvr: NVR,
    create_thumbnail: ThumbnailFactory,
) -> None:
    retention_limit_time = TIME_NOW_RETENTION_TESTS - timedelta(days=nvr.retention_days)

    async def _create(time: AwareDatetime) -> None:
        await create_thumbnail(camera_mac_address=camera.mac_address, timestamp=time)

    create_config = CreateConfig()
    await create_retention_resources(_create, retention_limit_time, create_config)
    errors = await enforce_thumbnails_retention(
        db_instance, MagicMock(), TIME_NOW_RETENTION_TESTS
    )
    assert errors == []

    async with db_instance.session() as session:

        async def _verify(end_time: AwareDatetime) -> list[ResourceRetentionData]:
            return await orm.Thumbnail.system_get_retention_data_for_camera(
                session, camera.mac_address, end_time, None
            )

        await verify_deleted_resources(
            _verify,
            retention_limit_time,
            ExpectedResources(num_in=create_config.num_in),
        )


async def test_enforce_thumbnails_retention_unassigned_camera(
    db_instance: database.Database,
    camera: Camera,
    nvr: NVR,
    create_thumbnail: ThumbnailFactory,
) -> None:
    retention_limit_time = TIME_NOW_RETENTION_TESTS - timedelta(days=nvr.retention_days)

    async def _create(time: AwareDatetime) -> None:
        await create_thumbnail(camera_mac_address=camera.mac_address, timestamp=time)

    # unassign the camera, note that thumbnails are
    # still attached to the previous tenant
    async with db_instance.session() as session:
        await orm.Camera.system_unassign_camera(session, camera.mac_address)

    create_config = CreateConfig()
    await create_retention_resources(_create, retention_limit_time, create_config)
    errors = await enforce_thumbnails_retention(
        db_instance, MagicMock(), TIME_NOW_RETENTION_TESTS
    )
    assert errors == []

    async with db_instance.session() as session:

        async def _verify(end_time: AwareDatetime) -> list[ResourceRetentionData]:
            return await orm.Thumbnail.system_get_retention_data_for_camera(
                session, camera.mac_address, end_time, None
            )

        await verify_deleted_resources(
            _verify,
            retention_limit_time,
            ExpectedResources(num_in=create_config.num_in),
        )
