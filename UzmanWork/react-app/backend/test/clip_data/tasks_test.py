from unittest.mock import MagicMock

import boto3

from backend.clip_data.models import ClipArchiveRequest
from backend.clip_data.tasks import archive_thumbnails
from backend.database import database, orm
from backend.database.models import Camera, ThumbnailCreate, ThumbnailType
from backend.database.organization_models import Organization
from backend.s3_utils import S3Path
from backend.test.factory_types import ClipDataFactory


async def test_archive_thumbnails(
    db_instance: database.Database,
    organization: Organization,
    camera: Camera,
    create_clip_data: ClipDataFactory,
) -> None:
    boto_session = MagicMock(spec=boto3.Session)

    clip_s3_path = S3Path("s3://bucket_clip/clip_folder/clip.mp4")
    clip_data = await create_clip_data(
        tenant=camera.tenant, mac_address=camera.mac_address, s3_path=clip_s3_path
    )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.Thumbnail.add_thumbnail_batch(
            session,
            [
                ThumbnailCreate(
                    camera_mac_address=clip_data.mac_address,
                    timestamp=clip_data.start_time,
                    thumbnail_type=ThumbnailType.THUMBNAIL,
                    s3_path=S3Path("s3://bucket_thumb/thumbnail.jpg"),
                )
            ],
        )
    clip_id = clip_data.id

    await archive_thumbnails(
        "dev",
        ClipArchiveRequest(
            mac_address=camera.mac_address,
            nvr_uuid="nvr-uuid",
            start_time=clip_data.start_time,
            end_time=clip_data.end_time,
            clip_id=clip_id,
            tenant=organization.name,
            video_orientation_type=camera.video_orientation_type,
        ),
        db_instance,
        boto_session,
    )
    # check that the thumbnail was archived
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        archived = await orm.ArchivedThumbnail.get_archived_thumbnails(session, clip_id)
        assert len(archived) == 1
        # where the thumbnail was archived is an implementation detail
        # as long as it's valid
        archived[0].s3_path.bucket_and_key(True)
