from datetime import timedelta
from unittest.mock import MagicMock

from backend.database import database, orm
from backend.database.models import NVR, Camera, LicensePlate, ResourceRetentionData
from backend.retention_management.license_plate_detections import (
    enforce_license_plate_detections_retention,
)
from backend.test.factory_types import LicensePlateDetectionFactory
from backend.test.retention_management.utils import (
    TIME_NOW_RETENTION_TESTS,
    CreateConfig,
    ExpectedResources,
    create_retention_resources,
    verify_deleted_resources,
)
from backend.utils import AwareDatetime


async def test_enforce_license_plate_detections_retention(
    db_instance: database.Database,
    camera: Camera,
    nvr: NVR,
    license_plate: LicensePlate,
    create_license_plate_detection: LicensePlateDetectionFactory,
) -> None:
    retention_limit_time = TIME_NOW_RETENTION_TESTS - timedelta(days=nvr.retention_days)

    async def _create(time: AwareDatetime) -> None:
        await create_license_plate_detection(
            mac_address=camera.mac_address,
            timestamp=time,
            license_plate_number=license_plate.license_plate_number,
        )

    create_config = CreateConfig()
    await create_retention_resources(_create, retention_limit_time, create_config)

    errors = await enforce_license_plate_detections_retention(
        db_instance, MagicMock(), TIME_NOW_RETENTION_TESTS
    )
    assert len(errors) == 0

    async with db_instance.session() as session:

        async def _verify(end_time: AwareDatetime) -> list[ResourceRetentionData]:
            return await orm.LicensePlateDetection.system_get_retention_data_for_camera(
                session, camera.mac_address, end_time, None
            )

        await verify_deleted_resources(
            _verify,
            retention_limit_time,
            ExpectedResources(num_in=create_config.num_in),
        )
