from datetime import timedelta
from unittest.mock import MagicMock

from backend.database import database, orm
from backend.database.face_models import NVRUniqueFace
from backend.database.models import NVR, Camera, ResourceRetentionData
from backend.retention_management.face_occurrences import (
    enforce_face_occurrences_retention,
)
from backend.test.factory_types import FaceOccurrenceFactory
from backend.test.retention_management.utils import (
    TIME_NOW_RETENTION_TESTS,
    CreateConfig,
    ExpectedResources,
    create_retention_resources,
    verify_deleted_resources,
)
from backend.utils import AwareDatetime


async def test_enforce_over_retention_face_occurrences(
    db_instance: database.Database,
    camera: Camera,
    nvr: NVR,
    nvr_unique_face: NVRUniqueFace,
    create_face_occurrence: FaceOccurrenceFactory,
) -> None:
    retention_limit_time = TIME_NOW_RETENTION_TESTS - timedelta(days=nvr.retention_days)

    async def _create(time: AwareDatetime) -> None:
        await create_face_occurrence(
            nvr_uuid=nvr.uuid,
            mac_address=camera.mac_address,
            occurrence_time=time,
            unique_face_id=nvr_unique_face.nvr_unique_face_id,
        )

    create_config = CreateConfig()
    await create_retention_resources(_create, retention_limit_time, create_config)
    errors = await enforce_face_occurrences_retention(
        db_instance, MagicMock(), TIME_NOW_RETENTION_TESTS
    )
    assert len(errors) == 0

    async with db_instance.session() as session:

        async def _verify(end_time: AwareDatetime) -> list[ResourceRetentionData]:
            return await orm.FaceOccurrence.system_get_retention_data_for_camera(
                session, camera.mac_address, end_time, None
            )

        await verify_deleted_resources(
            _verify,
            retention_limit_time,
            ExpectedResources(num_in=create_config.num_in),
        )
