import datetime

import pytest
from pydantic import EmailStr

import backend.database.models as models
from backend.database import database, orm
from backend.database.organization_models import Organization
from backend.database.orm.orm_archive import (
    ArchiveDeleteError,
    ArchiveNotFoundError,
    ArchiveUnshareError,
)
from backend.escapi.protocol_models import VideoResRequestType
from backend.kinesis_api.models import (
    KinesisArchivedVideoClipConfig,
    StaticResolutionConfig,
)
from backend.test.factory_types import CameraDefaultFactory
from backend.utils import AwareDatetime

DEFAULT_OWNER_USER_EMAIL = EmailStr("owner@test.com")
DEFAULT_CREATION_TIME = AwareDatetime(2023, 4, 27, 12, 00, tzinfo=datetime.timezone.utc)
DEFAULT_START_TIME = AwareDatetime(2022, 11, 20, 12, 00, tzinfo=datetime.timezone.utc)
DEFAULT_END_TIME = DEFAULT_START_TIME + datetime.timedelta(minutes=1)
TEST_ARCHIVE_TEXT = "Test Archive"


# TODO(@lberg): move these to fixtures as they are used by archive_thumbnails too
def _default_clip_data_create(mac_address: str) -> models.ClipDataCreate:
    return models.ClipDataCreate(
        mac_address=mac_address,
        start_time=DEFAULT_START_TIME,
        end_time=DEFAULT_END_TIME,
        creation_time=DEFAULT_CREATION_TIME,
    )


def _default_archive_create() -> models.ArchiveCreate:
    return models.ArchiveCreate(
        owner_user_email=DEFAULT_OWNER_USER_EMAIL,
        creation_time=DEFAULT_CREATION_TIME,
        title=TEST_ARCHIVE_TEXT,
        description="test",
        tags=[],
    )


async def test_update_clip_data_s3_path(
    db_instance: database.Database, camera: models.Camera, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        clip_data = await orm.ClipData.create_or_retrieve_clip_data(
            session, _default_clip_data_create(camera.mac_address)
        )

        await orm.ClipData.update_clip_data_s3_path_by_id(
            session, clip_data.id, "s3://test-bucket/test-path"
        )

        retrieved_clip_data = await orm.ClipData.system_get_clip_data_by_id(
            session, clip_data.id
        )
        assert retrieved_clip_data is not None
        assert retrieved_clip_data.s3_path == "s3://test-bucket/test-path"


async def test_create_clip_data(
    db_instance: database.Database, camera: models.Camera, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.ClipData.create_or_retrieve_clip_data(
            session, _default_clip_data_create(camera.mac_address)
        )


async def test_create_duplicated_clip_data(
    db_instance: database.Database, camera: models.Camera, organization: Organization
) -> None:
    clip_data = _default_clip_data_create(camera.mac_address)
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        clip_1 = await orm.ClipData.create_or_retrieve_clip_data(session, clip_data)
        clip_2 = await orm.ClipData.create_or_retrieve_clip_data(session, clip_data)
    assert clip_1.id == clip_2.id


async def test_create_archive(
    db_instance: database.Database,
    organization: Organization,
    create_camera_default: CameraDefaultFactory,
) -> None:
    camera1 = await create_camera_default()
    camera2 = await create_camera_default()
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        clips_data = [
            await orm.ClipData.create_or_retrieve_clip_data(
                session, _default_clip_data_create(camera.mac_address)
            )
            for camera in [camera1, camera2]
        ]
        archive = await orm.Archive.create_archive(session, _default_archive_create())
        await session.flush()

        for clip_data in clips_data:
            await orm.Archive.add_clip_to_archive(
                session, archive.id, clip_data, DEFAULT_OWNER_USER_EMAIL
            )

    assert archive.owner_user_email == DEFAULT_OWNER_USER_EMAIL
    assert archive.creation_time == DEFAULT_CREATION_TIME
    assert len(archive.clips) == 2
    assert archive.clips[0].clip.mac_address == camera1.mac_address
    assert archive.clips[1].clip.mac_address == camera2.mac_address


async def test_retrieve_user_owned_archives(
    db_instance: database.Database, organization: Organization
) -> None:
    archives_create = [_default_archive_create() for _ in range(10)]

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        for archive_create in archives_create:
            await orm.Archive.create_archive(session, archive_create)
        archives = await orm.Archive.get_archives_owned(
            session, DEFAULT_OWNER_USER_EMAIL
        )
    assert len(archives) == len(archives_create)


async def test_share_archive(
    db_instance: database.Database, organization: Organization
) -> None:
    share_with_emails = [EmailStr("user@test.com"), EmailStr("anotherUser@test.com")]

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        archive = await orm.Archive.create_archive(session, _default_archive_create())
        await session.flush()
        for email in share_with_emails:
            await orm.SharedArchive.share_archive(
                session,
                models.SharedArchiveCreate(archive_id=archive.id, user_email=email),
                user_email=DEFAULT_OWNER_USER_EMAIL,
            )
            archives = await orm.SharedArchive.get_archives_shared_with_user(
                session, email
            )
            assert len(archives) == 1
            assert archives[0].id == archive.id
    # To update the share_infos in the archive, we need to open a new session because
    # SQLAlchemy doesn't realise it need to update to include the new share_infos
    # after flushing the session:
    # https://stackoverflow.com/questions/50865795/sqlalchemy-relationship-not-updated-after-flush
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        archives = await orm.Archive.get_archives_owned(
            session, DEFAULT_OWNER_USER_EMAIL
        )
        assert len(archives) == 1
        # we should have backfilled the shared_with
        assert len(archives[0].share_infos) == len(share_with_emails)


async def test_share_archive_unauthorized_user(
    db_instance: database.Database, organization: Organization
) -> None:
    another_user_email = EmailStr("user@test.com")

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        archive = await orm.Archive.create_archive(session, _default_archive_create())
        await session.flush()
        # try to share the archive from another user
        with pytest.raises(ArchiveNotFoundError):
            await orm.SharedArchive.share_archive(
                session,
                models.SharedArchiveCreate(
                    archive_id=archive.id, user_email=another_user_email
                ),
                user_email=another_user_email,
            )


async def test_share_archive_with_invalid_archive_id(
    db_instance: database.Database, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        with pytest.raises(ArchiveNotFoundError):
            await orm.SharedArchive.share_archive(
                session,
                models.SharedArchiveCreate(
                    archive_id=1,  # invalid archive id
                    user_email=EmailStr("user@test.com"),
                ),
                user_email=DEFAULT_OWNER_USER_EMAIL,
            )
            await session.flush()


async def test_unshare_archive(
    db_instance: database.Database, organization: Organization
) -> None:
    share_with_emails = [EmailStr("user@test.com"), EmailStr("anotherUser@test.com")]

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        archive = await orm.Archive.create_archive(session, _default_archive_create())
        await session.flush()
        # share the archive with the users
        for email in share_with_emails:
            await orm.SharedArchive.share_archive(
                session,
                models.SharedArchiveCreate(archive_id=archive.id, user_email=email),
                user_email=DEFAULT_OWNER_USER_EMAIL,
            )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        # Check that the archive is shared with the users
        archives = await orm.Archive.get_archives_owned(
            session, DEFAULT_OWNER_USER_EMAIL
        )
        assert len(archives) == 1
        assert len(archives[0].share_infos) == len(share_with_emails), (
            f"Expect {len(share_with_emails)} shared archives, "
            f"got {archives[0].share_infos}"
        )

        # Unshare the shared archives with the users
        for email in share_with_emails:
            await orm.SharedArchive.unshare_archive(
                session,
                models.SharedArchiveCreate(archive_id=archive.id, user_email=email),
                user_email=DEFAULT_OWNER_USER_EMAIL,
            )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        # Check that the archive is no longer shared with the users
        archives = await orm.Archive.get_archives_owned(
            session, DEFAULT_OWNER_USER_EMAIL
        )
        assert len(archives) == 1
        assert (
            len(archives[0].share_infos) == 0
        ), f"Expect no shared archives, got {archives[0].share_infos}"


async def test_unshare_archive_with_invalid_inputs(
    db_instance: database.Database, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        archive = await orm.Archive.create_archive(session, _default_archive_create())
        await session.flush()
        # share the archive with the users
        await orm.SharedArchive.share_archive(
            session,
            models.SharedArchiveCreate(
                archive_id=archive.id, user_email=EmailStr("user@test.com")
            ),
            user_email=DEFAULT_OWNER_USER_EMAIL,
        )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        # Unshare the shared archives with the invalid archive id
        with pytest.raises(ArchiveNotFoundError):
            await orm.SharedArchive.unshare_archive(
                session,
                models.SharedArchiveCreate(
                    archive_id=archive.id + 1,  # invalid archive id
                    user_email=EmailStr("user@test.com"),
                ),
                user_email=DEFAULT_OWNER_USER_EMAIL,
            )
        # Unshare the shared archives with the invalid user email
        with pytest.raises(ArchiveUnshareError):
            await orm.SharedArchive.unshare_archive(
                session,
                models.SharedArchiveCreate(
                    archive_id=archive.id, user_email=EmailStr("another_user@test.com")
                ),
                user_email=DEFAULT_OWNER_USER_EMAIL,
            )


async def test_unshare_archive_unauthorized_user(
    db_instance: database.Database, organization: Organization
) -> None:
    auth_user_email = EmailStr("authUser@test.com")
    another_user_email = EmailStr("user@test.com")

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        archive = await orm.Archive.create_archive(session, _default_archive_create())
        await session.flush()
        await orm.SharedArchive.share_archive(
            session,
            models.SharedArchiveCreate(
                archive_id=archive.id, user_email=auth_user_email
            ),
            user_email=DEFAULT_OWNER_USER_EMAIL,
        )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        with pytest.raises(ArchiveNotFoundError):
            await orm.SharedArchive.unshare_archive(
                session,
                models.SharedArchiveCreate(
                    archive_id=archive.id, user_email=auth_user_email
                ),
                user_email=another_user_email,
            )


async def test_delete_archive(
    db_instance: database.Database, camera: models.Camera, organization: Organization
) -> None:
    share_with_email = EmailStr("user@test.com")

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        clip_data = await orm.ClipData.create_or_retrieve_clip_data(
            session, _default_clip_data_create(camera.mac_address)
        )
        archive = await orm.Archive.create_archive(session, _default_archive_create())
        await session.flush()
        await orm.Archive.add_clip_to_archive(
            session, archive.id, clip_data, DEFAULT_OWNER_USER_EMAIL
        )
        await orm.SharedArchive.share_archive(
            session,
            models.SharedArchiveCreate(
                archive_id=archive.id, user_email=share_with_email
            ),
            user_email=DEFAULT_OWNER_USER_EMAIL,
        )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        # Expect one shared archive for the user before the deletion
        shared_archives = await orm.SharedArchive.get_shared_archives_by_archive_id(
            session, archive.id
        )
        assert len(shared_archives) == 1
        # Delete the archive by archive id
        await orm.Archive.delete_archive(session, archive.id, DEFAULT_OWNER_USER_EMAIL)
        archives = await orm.Archive.get_archives_owned(
            session, DEFAULT_OWNER_USER_EMAIL
        )
        assert len(archives) == 0
        # Expect no archives shared with the user.
        archives_shared_with_user = (
            await orm.SharedArchive.get_archives_shared_with_user(
                session, share_with_email
            )
        )
        assert len(archives_shared_with_user) == 0
        # Cascade delete should have deleted the shared archive too.
        shared_archives = await orm.SharedArchive.get_shared_archives_by_archive_id(
            session, archive.id
        )
        assert len(shared_archives) == 0
        # Cascade should have deleted the association only.
        clip = await orm.ClipData.system_get_clip_data_by_id(session, clip_data.id)
        assert clip is not None


async def test_delete_archive_unauthorized(
    db_instance: database.Database, camera: models.Camera, organization: Organization
) -> None:
    share_with_email = EmailStr("user@test.com")

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        clip_data = await orm.ClipData.create_or_retrieve_clip_data(
            session, _default_clip_data_create(camera.mac_address)
        )
        archive = await orm.Archive.create_archive(session, _default_archive_create())
        await session.flush()

        await orm.Archive.add_clip_to_archive(
            session, archive.id, clip_data, DEFAULT_OWNER_USER_EMAIL
        )
        await orm.SharedArchive.share_archive(
            session,
            models.SharedArchiveCreate(
                archive_id=archive.id, user_email=share_with_email
            ),
            user_email=DEFAULT_OWNER_USER_EMAIL,
        )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        with pytest.raises(ArchiveDeleteError):
            await orm.Archive.delete_archive(session, archive.id, share_with_email)


async def test_delete_archive_with_invalid_id(
    db_instance: database.Database, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        # Delete the archive by invalid archive id
        with pytest.raises(ArchiveDeleteError):
            await orm.Archive.delete_archive(
                session=session, archive_id=0, user_email=DEFAULT_OWNER_USER_EMAIL
            )


async def test_delete_clip_data(
    db_instance: database.Database, camera: models.Camera, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        clip_data = await orm.ClipData.create_or_retrieve_clip_data(
            session, _default_clip_data_create(camera.mac_address)
        )
        archive = await orm.Archive.create_archive(session, _default_archive_create())
        await session.flush()

        await orm.Archive.add_clip_to_archive(
            session, archive.id, clip_data, DEFAULT_OWNER_USER_EMAIL
        )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.ClipData.delete_clip_data_by_id(session, clip_data.id)
        clip = await orm.ClipData.system_get_clip_data_by_id(session, clip_data.id)
        assert clip is None
        # Cascade should have deleted the association only.
        archives = await orm.Archive.get_archives_owned(
            session, DEFAULT_OWNER_USER_EMAIL
        )
        assert len(archives) == 1


async def test_edit_description_archive(
    db_instance: database.Database, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        archive = await orm.Archive.create_archive(session, _default_archive_create())
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.Archive.update_archive_description(
            session, archive.id, "test2", DEFAULT_OWNER_USER_EMAIL
        )
        archives = await orm.Archive.get_archives_owned(
            session, DEFAULT_OWNER_USER_EMAIL
        )
        assert len(archives) == 1
        assert archives[0].description == "test2"


async def test_edit_description_archive_unauthorized(
    db_instance: database.Database, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        archive = await orm.Archive.create_archive(session, _default_archive_create())
        with pytest.raises(ArchiveNotFoundError):
            await orm.Archive.update_archive_description(
                session, archive.id, "test2", "anotheruser@gmail.com"
            )


async def test_edit_description_invalid_archive(
    db_instance: database.Database, organization: Organization
) -> None:
    with pytest.raises(ArchiveNotFoundError):
        async with db_instance.tenant_session(tenant=organization.tenant) as session:
            await orm.Archive.update_archive_description(
                session, 1, "test2", DEFAULT_OWNER_USER_EMAIL
            )


async def test_admin_only_edit_archive_description(
    db_instance: database.Database, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        archive = await orm.Archive.create_archive(session, _default_archive_create())

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.Archive.admin_only_update_archive_description(
            session, archive.id, "test2"
        )
        archives = await orm.Archive.get_archives_owned(
            session, DEFAULT_OWNER_USER_EMAIL
        )
        assert len(archives) == 1
        assert archives[0].description == "test2"


async def test_admin_only_edit_archive_description_invalid_archive(
    db_instance: database.Database, organization: Organization
) -> None:
    with pytest.raises(ArchiveNotFoundError):
        async with db_instance.tenant_session(tenant=organization.tenant) as session:
            await orm.Archive.admin_only_update_archive_description(session, 1, "test2")


async def test_admin_only_edit_archive_description_invalid_tenant(
    db_instance: database.Database, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        archive = await orm.Archive.create_archive(session, _default_archive_create())

    with pytest.raises(ArchiveNotFoundError):
        async with db_instance.tenant_session(tenant="another tenant") as session:
            await orm.Archive.admin_only_update_archive_description(
                session, archive.id, "test2"
            )


async def test_update_clip_stream_name_and_retention(
    db_instance: database.Database,
    organization: Organization,
    create_camera_default: CameraDefaultFactory,
) -> None:
    camera = await create_camera_default()

    # Create a ClipData entry without a kvs_stream_name and expiration date
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        clips_data_row = await orm.ClipData.create_or_retrieve_clip_data(
            session, _default_clip_data_create(camera.mac_address)
        )
        clip_data = models.ClipData.from_orm(clips_data_row)
        await session.flush()

    kinesis_video_clip_request = KinesisArchivedVideoClipConfig(
        stream_hash=camera.source,
        start_time=clip_data.start_time,
        end_time=clip_data.end_time,
        clip_id=clip_data.id,
        resolution_config=StaticResolutionConfig(
            static_resolution=VideoResRequestType.High
        ),
    )

    retention_duration = datetime.timedelta(days=1)
    clip_expiration_time = DEFAULT_CREATION_TIME + retention_duration
    # Update the ClipData entry with a kvs_stream_name and expiration date
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.ClipData.update_clip_data_kvs_stream_by_id(
            session,
            clip_data.id,
            kinesis_video_clip_request.upload_stream_name,
            clip_expiration_time,
        )
        await session.flush()

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        clip_data_row = await orm.ClipData.system_get_clip_data_by_id(
            session, clip_data.id
        )
        clip_data_read = models.ClipData.from_orm(clip_data_row)
    # Check the kv_stream_name and expiration date are expected.
    assert (
        clip_data_read.kvs_stream_name == kinesis_video_clip_request.upload_stream_name
    )
    assert clip_data_read.expiration_time == clip_expiration_time


async def test_forward_clip_stream_request(
    db_instance: database.Database,
    create_camera_default: CameraDefaultFactory,
    organization: Organization,
) -> None:
    camera1 = await create_camera_default()
    camera2 = await create_camera_default()
    # Create a ClipData entry without a kvs_stream_name and expiration date
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        clips_data_row = await orm.ClipData.create_or_retrieve_clip_data(
            session, _default_clip_data_create(camera1.mac_address)
        )
        clip_data = models.ClipData.from_orm(clips_data_row)
        await session.flush()

    kinesis_video_clip_request1 = KinesisArchivedVideoClipConfig(
        stream_hash=camera1.source,
        start_time=clip_data.start_time,
        end_time=clip_data.end_time,
        clip_id=clip_data.id,
        resolution_config=StaticResolutionConfig(
            static_resolution=VideoResRequestType.High
        ),
    )
    kinesis_video_clip_request2 = KinesisArchivedVideoClipConfig(
        stream_hash=camera2.source,
        start_time=clip_data.start_time,
        end_time=clip_data.end_time,
        clip_id=clip_data.id,
        resolution_config=StaticResolutionConfig(
            static_resolution=VideoResRequestType.High
        ),
    )

    assert (
        kinesis_video_clip_request1.upload_stream_name
        != kinesis_video_clip_request2.upload_stream_name
    )

    kinesis_video_clip_request_forwarded1 = (
        kinesis_video_clip_request1.forward_using_stream_name(
            kinesis_video_clip_request2.upload_stream_name
        )
    )

    assert (
        kinesis_video_clip_request_forwarded1.upload_stream_name
        == kinesis_video_clip_request2.upload_stream_name
    )


async def test_get_archive_clip_data(
    db_instance: database.Database, camera: models.Camera, organization: Organization
) -> None:
    num_clips = 10
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        archive = await orm.Archive.create_archive(session, _default_archive_create())

        for idx_clip in range(num_clips):
            clip_data = await orm.ClipData.create_or_retrieve_clip_data(
                session,
                models.ClipDataCreate(
                    mac_address=camera.mac_address,
                    start_time=DEFAULT_START_TIME
                    + datetime.timedelta(minutes=idx_clip),
                    end_time=DEFAULT_END_TIME,
                    creation_time=DEFAULT_CREATION_TIME,
                ),
            )
            await orm.Archive.add_clip_to_archive(
                session, archive.id, clip_data, DEFAULT_OWNER_USER_EMAIL
            )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        retrieved_clips = await orm.ArchiveClipData.get_archive_clip_data(
            session, archive.id
        )

    assert len(retrieved_clips) == num_clips


async def test_get_archive_comments(
    db_instance: database.Database, organization: Organization
) -> None:
    num_comments = 10
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        archive = await orm.Archive.create_archive(session, _default_archive_create())
        await session.flush()

        for _ in range(num_comments):
            await orm.ArchiveComment.create_comment(
                session,
                archive.id,
                DEFAULT_OWNER_USER_EMAIL,
                "test comment",
                DEFAULT_CREATION_TIME,
            )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        retrieved_comments = await orm.ArchiveComment.get_archive_comments(
            session, archive.id
        )

    assert len(retrieved_comments) == num_comments
