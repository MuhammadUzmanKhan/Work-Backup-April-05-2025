import pytest_asyncio
import sqlalchemy as sa

from backend.database import database, orm
from backend.database.models import ArchiveThumbnailCreate, MctImageCreate
from backend.database.organization_models import Organization
from backend.s3_utils import S3Path
from backend.test.factory_types import RandomStringFactory
from backend.test.retention_management.factory_types import (
    ArchivedThumbnailFactory,
    MctImageFactory,
)
from backend.utils import AwareDatetime


@pytest_asyncio.fixture()
async def create_mct_image(
    db_instance: database.Database,
    organization: Organization,
    create_perception_stack_start_id: RandomStringFactory,
    create_s3_url: RandomStringFactory,
) -> MctImageFactory:
    async def create_mct_image_inner(
        mac_address: str, timestamp: AwareDatetime = AwareDatetime.utcnow()
    ) -> None:
        async with db_instance.tenant_session(tenant=organization.tenant) as session:
            await orm.MctImage.add_mct_image_batch(
                session,
                [
                    MctImageCreate(
                        camera_mac_address=mac_address,
                        timestamp=timestamp,
                        track_id=0,
                        perception_stack_start_id=create_perception_stack_start_id(),
                        s3_path=S3Path(create_s3_url()),
                    )
                ],
            )

    return create_mct_image_inner


@pytest_asyncio.fixture()
async def create_archived_thumbnail(
    db_instance: database.Database, organization: Organization
) -> ArchivedThumbnailFactory:
    async def create_archived_thumbnail_inner(
        s3_path: S3Path, clip_id: int, timestamp: AwareDatetime | None = None
    ) -> None:
        async with db_instance.tenant_session(tenant=organization.tenant) as session:
            await orm.ArchivedThumbnail.add_archive_thumbnail_batch(
                session,
                [
                    ArchiveThumbnailCreate(
                        timestamp=timestamp or AwareDatetime.utcnow(), s3_path=s3_path
                    )
                ],
                clip_id,
            )

    return create_archived_thumbnail_inner


@pytest_asyncio.fixture()
async def mocked_part_config(db_instance: database.Database) -> None:
    async with db_instance.session() as session:
        await session.execute(sa.text("CREATE SCHEMA partman AUTHORIZATION postgres"))
        await session.execute(
            sa.text(
                "CREATE TABLE partman.part_config (parent_table text not null,"
                " retention text not null, retention_keep_table boolean not null"
                " default true)"
            )
        )
