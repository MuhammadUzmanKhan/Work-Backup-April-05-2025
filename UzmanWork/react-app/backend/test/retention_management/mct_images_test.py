from datetime import timedelta
from unittest.mock import MagicMock

from backend.database import database, orm
from backend.database.models import NVR, Camera, ResourceRetentionData
from backend.retention_management.mct_images import enforce_mct_images_retention
from backend.test.retention_management.factory_types import MctImageFactory
from backend.test.retention_management.utils import (
    TIME_NOW_RETENTION_TESTS,
    CreateConfig,
    ExpectedResources,
    create_retention_resources,
    verify_deleted_resources,
)
from backend.utils import AwareDatetime


async def test_delete_over_retention_mct_images(
    db_instance: database.Database,
    camera: Camera,
    nvr: NVR,
    create_mct_image: MctImageFactory,
) -> None:
    retention_limit_time = TIME_NOW_RETENTION_TESTS - timedelta(days=nvr.retention_days)

    async def _create(time: AwareDatetime) -> None:
        await create_mct_image(mac_address=camera.mac_address, timestamp=time)

    create_config = CreateConfig()
    await create_retention_resources(_create, retention_limit_time, create_config)
    errors = await enforce_mct_images_retention(
        db_instance, MagicMock(), TIME_NOW_RETENTION_TESTS
    )
    assert len(errors) == 0

    async with db_instance.session() as session:

        async def _verify(end_time: AwareDatetime) -> list[ResourceRetentionData]:
            return await orm.MctImage.system_get_retention_data_for_camera(
                session, camera.mac_address, end_time, None
            )

        await verify_deleted_resources(
            _verify,
            retention_limit_time,
            ExpectedResources(num_in=create_config.num_in),
        )
