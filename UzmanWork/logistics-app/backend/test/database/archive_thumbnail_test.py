import pytest

from backend.database import database, orm
from backend.database.models import ArchiveThumbnailCreate, Camera
from backend.database.organization_models import Organization
from backend.database.orm.orm_archived_thumbnails import ArchivedThumbnailsNotFound
from backend.s3_utils import S3Path
from backend.test.database.archive_test import _default_clip_data_create
from backend.utils import AwareDatetime

# TODO(@lberg): refactor all tests to use fixtures after migration with tenant is done


def _generate_archive_thumbnails(
    timestamps: list[AwareDatetime],
) -> list[ArchiveThumbnailCreate]:
    """Util function to generate a list of thumbnails."""
    return [
        ArchiveThumbnailCreate(
            timestamp=timestamp, s3_path=S3Path("s3://bucket/path/to/thumbnail.jpg")
        )
        for timestamp in timestamps
    ]


async def _add_archive_thumbnail_batch(
    db_instance: database.Database,
    tenant: str,
    clip_id: int,
    data: list[ArchiveThumbnailCreate],
) -> None:
    async with db_instance.tenant_session(tenant=tenant) as session:
        await orm.ArchivedThumbnail.add_archive_thumbnail_batch(session, data, clip_id)


async def test_get_archive_thumbnails(
    db_instance: database.Database, organization: Organization, camera: Camera
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        clip_data = await orm.ClipData.create_or_retrieve_clip_data(
            session, _default_clip_data_create(camera.mac_address)
        )

    requests = _generate_archive_thumbnails(
        timestamps=[
            AwareDatetime.from_datetime_str("2021-01-01T00:00:00+00:00"),
            AwareDatetime.from_datetime_str("2021-01-01T00:00:01+00:00"),
        ]
    )
    await _add_archive_thumbnail_batch(
        db_instance, organization.tenant, clip_data.id, requests
    )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        result = await orm.ArchivedThumbnail.get_archived_thumbnails(
            session, clip_data.id
        )
    assert len(result) == len(requests)


async def test_get_archive_thumbnails_not_found(
    db_instance: database.Database, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        with pytest.raises(ArchivedThumbnailsNotFound):
            await orm.ArchivedThumbnail.get_archived_thumbnails(session, clip_id=1)


async def test_archive_thumbnails_preview_empty(
    db_instance: database.Database, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        result = await orm.ArchivedThumbnail.get_archived_thumbnails_preview(
            session, [1, 2, 3]
        )
        assert len(result) == 0


async def test_archive_thumbnails_preview_expected_time(
    db_instance: database.Database, organization: Organization, camera: Camera
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        clip_data = await orm.ClipData.create_or_retrieve_clip_data(
            session, _default_clip_data_create(camera.mac_address)
        )

    middle_time = AwareDatetime.from_datetime_str("2021-01-01T00:00:02+00:00")
    requests = _generate_archive_thumbnails(
        timestamps=[
            AwareDatetime.from_datetime_str("2021-01-01T00:00:00+00:00"),
            AwareDatetime.from_datetime_str("2021-01-01T00:00:01+00:00"),
            middle_time,
            AwareDatetime.from_datetime_str("2021-01-01T00:00:03+00:00"),
            AwareDatetime.from_datetime_str("2021-01-01T00:00:010+00:00"),
        ]
    )
    await _add_archive_thumbnail_batch(
        db_instance, organization.tenant, clip_data.id, requests
    )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        result = await orm.ArchivedThumbnail.get_archived_thumbnails_preview(
            session, [clip_data.id]
        )
        assert len(result) == 1
        first_preview = result.get(clip_data.id)
        assert first_preview is not None
        assert first_preview.timestamp == middle_time


async def test_archive_thumbnails_preview_multiple_archives(
    db_instance: database.Database, organization: Organization, camera: Camera
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        clip_data = await orm.ClipData.create_or_retrieve_clip_data(
            session, _default_clip_data_create(camera.mac_address)
        )

    requests = _generate_archive_thumbnails(
        timestamps=[
            AwareDatetime.from_datetime_str("2021-01-01T00:00:00+00:00"),
            AwareDatetime.from_datetime_str("2021-01-01T00:00:01+00:00"),
        ]
    )
    await _add_archive_thumbnail_batch(
        db_instance, organization.tenant, clip_data.id, requests
    )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        result = await orm.ArchivedThumbnail.get_archived_thumbnails_preview(
            session, [clip_data.id, clip_data.id + 1]
        )
        assert len(result) == 1
        assert result.get(clip_data.id) is not None
        assert result.get(clip_data.id + 1) is None
