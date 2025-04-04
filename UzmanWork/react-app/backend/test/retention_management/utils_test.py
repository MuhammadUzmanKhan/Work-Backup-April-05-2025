from datetime import timedelta
from unittest.mock import MagicMock

from pytest_mock import MockerFixture
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import database
from backend.database.models import NVR, Camera, ResourceRetentionData
from backend.retention_management.exceptions import ResourceS3DeleteError
from backend.retention_management.utils import enforce_resource_retention
from backend.s3_utils import S3Path
from backend.test.factory_types import RandomStringFactory
from backend.test.retention_management.utils import (
    TIME_NOW_RETENTION_TESTS,
    CreateConfig,
    ExpectedResources,
    create_retention_resources,
    verify_deleted_resources,
)
from backend.utils import AwareDatetime


class MockedDataHolder:
    data: list[ResourceRetentionData]

    def __init__(self) -> None:
        self.data = []

    async def add_resource_data(self, resourceData: ResourceRetentionData) -> None:
        self.data.append(resourceData)
        self.data.sort(key=lambda x: x.timestamp)

    async def get_resource_data_in_range(
        self,
        session: AsyncSession,
        mac_address: str,
        end_time: AwareDatetime,
        limit: int | None,
    ) -> list[ResourceRetentionData]:
        resources = [
            resource for resource in self.data if resource.timestamp <= end_time
        ]
        if limit is not None:
            resources = resources[:limit]
        return resources

    async def delete_resource_in_range(
        self,
        session: AsyncSession,
        mac_address: str,
        start_time: AwareDatetime,
        end_time: AwareDatetime,
    ) -> None:
        self.data = [
            resource
            for resource in self.data
            if resource.timestamp < start_time or resource.timestamp > end_time
        ]


async def test_enforce_resource_retention_s3_fail(
    db_instance: database.Database,
    camera: Camera,
    nvr: NVR,
    mocker: MockerFixture,
    create_s3_url: RandomStringFactory,
) -> None:
    retention_limit_time = TIME_NOW_RETENTION_TESTS - timedelta(days=nvr.retention_days)
    mocked_holder = MockedDataHolder()

    async def _create(time: AwareDatetime) -> None:
        resource = ResourceRetentionData(
            s3_paths=[S3Path(create_s3_url())], timestamp=time
        )
        await mocked_holder.add_resource_data(resource)

    create_config = CreateConfig()
    await create_retention_resources(_create, retention_limit_time, create_config)

    mocker.patch(
        "backend.retention_management.utils.s3_batch_delete",
        side_effect=ResourceS3DeleteError("error deleting data"),
    )

    errors = await enforce_resource_retention(
        db_instance,
        "mock",
        MagicMock(),
        mocked_holder.get_resource_data_in_range,
        mocked_holder.delete_resource_in_range,
        per_camera_delete_limit=create_config.num_out,
        time_now=TIME_NOW_RETENTION_TESTS,
    )
    assert len(errors) > 0

    # we should have not deleted any resources
    async with db_instance.tenant_session(tenant=camera.tenant) as session:

        async def _verify(end_time: AwareDatetime) -> list[ResourceRetentionData]:
            return await mocked_holder.get_resource_data_in_range(
                session, camera.mac_address, end_time, None
            )

        await verify_deleted_resources(
            _verify,
            retention_limit_time,
            ExpectedResources.from_create_config(create_config),
        )


async def test_enforce_resource_retention_limit_delete(
    db_instance: database.Database,
    camera: Camera,
    nvr: NVR,
    create_s3_url: RandomStringFactory,
) -> None:
    retention_limit_time = TIME_NOW_RETENTION_TESTS - timedelta(days=nvr.retention_days)
    mocked_holder = MockedDataHolder()

    create_config = CreateConfig()
    await create_retention_resources(
        lambda time: mocked_holder.add_resource_data(
            ResourceRetentionData(s3_paths=[S3Path(create_s3_url())], timestamp=time)
        ),
        retention_limit_time,
        create_config,
    )

    errors = await enforce_resource_retention(
        db_instance,
        "mock",
        MagicMock(),
        mocked_holder.get_resource_data_in_range,
        mocked_holder.delete_resource_in_range,
        per_camera_delete_limit=create_config.num_out // 2,
        time_now=TIME_NOW_RETENTION_TESTS,
    )
    assert len(errors) == 0

    # we should have delete half the resources before the retention limit
    async with db_instance.tenant_session(tenant=camera.tenant) as session:

        async def _verify(end_time: AwareDatetime) -> list[ResourceRetentionData]:
            return await mocked_holder.get_resource_data_in_range(
                session, camera.mac_address, end_time, None
            )

        await verify_deleted_resources(
            _verify,
            retention_limit_time,
            ExpectedResources(
                num_in=create_config.num_in, num_out=create_config.num_out // 2
            ),
        )


async def test_enforce_resource_retention_no_results(
    db_instance: database.Database,
    camera: Camera,
    nvr: NVR,
    create_s3_url: RandomStringFactory,
) -> None:
    retention_limit_time = TIME_NOW_RETENTION_TESTS - timedelta(days=nvr.retention_days)
    mocked_holder = MockedDataHolder()
    create_config = CreateConfig(num_out=0)

    await create_retention_resources(
        lambda time: mocked_holder.add_resource_data(
            ResourceRetentionData(s3_paths=[S3Path(create_s3_url())], timestamp=time)
        ),
        retention_limit_time,
        create_config,
    )

    errors = await enforce_resource_retention(
        db_instance,
        "mock",
        MagicMock(),
        mocked_holder.get_resource_data_in_range,
        mocked_holder.delete_resource_in_range,
        per_camera_delete_limit=create_config.num_out,
        time_now=TIME_NOW_RETENTION_TESTS,
    )
    assert len(errors) == 0

    # we should have delete nothing
    async with db_instance.tenant_session(tenant=camera.tenant) as session:

        async def _verify(end_time: AwareDatetime) -> list[ResourceRetentionData]:
            return await mocked_holder.get_resource_data_in_range(
                session, camera.mac_address, end_time, None
            )

        await verify_deleted_resources(
            _verify,
            retention_limit_time,
            ExpectedResources.from_create_config(create_config),
        )
