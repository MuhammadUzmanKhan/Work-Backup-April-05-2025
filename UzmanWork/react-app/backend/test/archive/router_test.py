import datetime
from unittest.mock import Mock

from fastapi import FastAPI, status
from httpx import AsyncClient
from pydantic import EmailStr

import backend.database.models as models
from backend import auth, auth_models
from backend.archive.models import (
    ArchiveAddClipRequest,
    ArchiveClip,
    ArchiveRequest,
    ArchiveResponse,
    ArchiveSummaryResponse,
    SetArchiveTagsRequest,
    ShareArchiveRequest,
)
from backend.database import database, orm
from backend.database.models import Camera
from backend.database.organization_models import Organization
from backend.database.tag_models import Tag
from backend.test.archive.utils_test import _default_archive_create
from backend.test.client_request import (
    send_delete_request,
    send_get_request,
    send_post_request,
)
from backend.test.conftest import mock_app_user_guard
from backend.test.database.archive_thumbnail_test import (
    _add_archive_thumbnail_batch,
    _generate_archive_thumbnails,
)
from backend.test.factory_types import AppUserFactory, RandomStringFactory
from backend.utils import AwareDatetime

DEFAULT_START_TIME = AwareDatetime(2022, 11, 20, 12, 00, tzinfo=datetime.timezone.utc)
DEFAULT_END_TIME = DEFAULT_START_TIME + datetime.timedelta(minutes=1)
TEST_ARCHIVE_TEXT = "Test Archive"
FIRST_ARCHIVE_TEXT = "First archive"
FIRST_DESCRIPTION_TEXT = "First description"


async def test_create_archive(archive_client: AsyncClient, camera: Camera) -> None:
    await send_post_request(
        archive_client,
        "",
        ArchiveRequest(
            clip_request=ArchiveClip(
                mac_address=camera.mac_address,
                start_time=DEFAULT_START_TIME,
                end_time=DEFAULT_END_TIME,
            ),
            title=TEST_ARCHIVE_TEXT,
            archive_description="test",
            tags=[],
        ),
    )


async def test_create_archive_with_tag(
    archive_client: AsyncClient, camera: Camera, tag: Tag
) -> None:
    await send_post_request(
        archive_client,
        "",
        ArchiveRequest(
            clip_request=ArchiveClip(
                mac_address=camera.mac_address,
                start_time=DEFAULT_START_TIME,
                end_time=DEFAULT_END_TIME,
            ),
            title=TEST_ARCHIVE_TEXT,
            archive_description="test",
            tags=[tag.id],
        ),
    )
    archives_response = await send_get_request(archive_client, "/user_archives")
    archives = [ArchiveResponse.parse_obj(a) for a in archives_response.json()]
    assert len(archives) == 1
    assert len(archives[0].tags) == 1
    assert archives[0].tags[0].id == tag.id


async def test_summary(archive_client: AsyncClient, camera: Camera) -> None:
    archive_requests = [
        ArchiveRequest(
            clip_request=ArchiveClip(
                mac_address=camera.mac_address,
                start_time=DEFAULT_START_TIME,
                end_time=DEFAULT_END_TIME,
            ),
            title=FIRST_ARCHIVE_TEXT,
            archive_description=FIRST_DESCRIPTION_TEXT,
            tags=[],
        ),
        ArchiveRequest(
            clip_request=ArchiveClip(
                mac_address=camera.mac_address,
                start_time=DEFAULT_START_TIME,
                end_time=DEFAULT_END_TIME + datetime.timedelta(minutes=1),
            ),
            title="second archive",
            archive_description="end description",
            tags=[],
        ),
    ]
    for archive_request in archive_requests:
        await send_post_request(archive_client, "", archive_request)
    response = await send_get_request(archive_client, "summary")
    json_list = response.json()
    assert len(json_list) == 2
    for element in json_list:
        summary = ArchiveSummaryResponse.parse_obj(element)
        assert summary.description in [
            request.archive_description for request in archive_requests
        ]
        assert summary.title in [request.title for request in archive_requests]


async def test_add_clip_to_existing_archive(
    archive_client: AsyncClient, camera: Camera
) -> None:
    # Create an archive with one clip
    response = await send_post_request(
        archive_client,
        "",
        ArchiveRequest(
            clip_request=ArchiveClip(
                mac_address=camera.mac_address,
                start_time=DEFAULT_START_TIME,
                end_time=DEFAULT_END_TIME,
            ),
            title=FIRST_ARCHIVE_TEXT,
            archive_description=FIRST_DESCRIPTION_TEXT,
            tags=[],
        ),
    )
    # Add a second clip to the archive
    await send_post_request(
        archive_client,
        f"add_clip/{response.text}",
        ArchiveAddClipRequest(
            archive_clip=ArchiveClip(
                mac_address=camera.mac_address,
                start_time=DEFAULT_START_TIME,
                end_time=DEFAULT_END_TIME + datetime.timedelta(minutes=1),
            ),
            comment="second clip",
        ),
    )
    # TODO(@lberg): check that the archive has two clips


async def test_add_clip_to_existing_archive_shared_user_invalid(
    archive_client: AsyncClient,
    camera: Camera,
    app_user: auth_models.AppUser,
    create_email: RandomStringFactory,
    app: FastAPI,
) -> None:
    other_user_email = create_email()
    # Create an archive with one clip
    response = await send_post_request(
        archive_client,
        "",
        ArchiveRequest(
            clip_request=ArchiveClip(
                mac_address=camera.mac_address,
                start_time=DEFAULT_START_TIME,
                end_time=DEFAULT_END_TIME,
            ),
            title=FIRST_ARCHIVE_TEXT,
            archive_description=FIRST_DESCRIPTION_TEXT,
            tags=[],
        ),
    )

    # overwrite the limited user role guard to be a different user
    limited_user = app_user.copy()
    limited_user.role = auth.UserRole.LIMITED
    limited_user.user_email = other_user_email
    app.dependency_overrides[auth.limited_user_role_guard] = lambda: limited_user

    # Add a second clip to the archive as the other user
    app_user.user_email = other_user_email
    await send_post_request(
        archive_client,
        f"add_clip/{response.text}",
        ArchiveAddClipRequest(
            archive_clip=ArchiveClip(
                mac_address=camera.mac_address,
                start_time=DEFAULT_START_TIME,
                end_time=DEFAULT_END_TIME + datetime.timedelta(minutes=1),
            ),
            comment="second clip",
        ),
        expected_status_code=status.HTTP_400_BAD_REQUEST,
    )


async def test_add_clip_to_existing_archive_shared_user(
    archive_client: AsyncClient,
    camera: Camera,
    app_user: auth_models.AppUser,
    create_email: RandomStringFactory,
    app: FastAPI,
) -> None:
    other_user_email = create_email()
    # Create an archive with one clip
    response = await send_post_request(
        archive_client,
        "",
        ArchiveRequest(
            clip_request=ArchiveClip(
                mac_address=camera.mac_address,
                start_time=DEFAULT_START_TIME,
                end_time=DEFAULT_END_TIME,
            ),
            title=FIRST_ARCHIVE_TEXT,
            archive_description=FIRST_DESCRIPTION_TEXT,
            tags=[],
        ),
    )
    # share the archive with another user
    await send_post_request(
        archive_client,
        "share",
        ShareArchiveRequest(
            archive_id=int(response.text),
            emails=[EmailStr(other_user_email)],
            sender_email=app_user.user_email,
        ),
    )

    # overwrite the limited user role guard to be a different user
    limited_user = app_user.copy()
    limited_user.role = auth.UserRole.LIMITED
    limited_user.user_email = other_user_email
    app.dependency_overrides[auth.limited_user_role_guard] = await mock_app_user_guard(
        limited_user
    )

    await send_post_request(
        archive_client,
        f"add_clip/{response.text}",
        ArchiveAddClipRequest(
            archive_clip=ArchiveClip(
                mac_address=camera.mac_address,
                start_time=DEFAULT_START_TIME,
                end_time=DEFAULT_END_TIME + datetime.timedelta(minutes=1),
            ),
            comment="second clip",
        ),
    )


async def test_share_archive(
    archive_client: AsyncClient,
    camera: Camera,
    db_instance: database.Database,
    organization: Organization,
    create_email: RandomStringFactory,
    share_with_emails: list[str],
) -> None:
    # Create the archive
    response = await send_post_request(
        archive_client,
        "",
        ArchiveRequest(
            clip_request=ArchiveClip(
                mac_address=camera.mac_address,
                start_time=DEFAULT_START_TIME,
                end_time=DEFAULT_END_TIME,
            ),
            title=FIRST_ARCHIVE_TEXT,
            archive_description=FIRST_DESCRIPTION_TEXT,
            tags=[],
        ),
    )
    # Share the archive
    await send_post_request(
        archive_client,
        "share",
        ShareArchiveRequest(
            archive_id=int(response.text),
            emails=share_with_emails,
            sender_email=create_email(),
        ),
    )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        for email in share_with_emails:
            archives = await orm.SharedArchive.get_archives_shared_with_user(
                session, email
            )
            assert len(archives) == 1


async def test_share_invalid_archive(
    archive_client: AsyncClient,
    email_client_mock: Mock,
    create_email: RandomStringFactory,
    share_with_emails: list[str],
) -> None:
    # Share an archive that doesn't exist
    await send_post_request(
        archive_client,
        "share",
        ShareArchiveRequest(
            archive_id=1, emails=share_with_emails, sender_email=create_email()
        ),
        expected_status_code=status.HTTP_400_BAD_REQUEST,
    )


async def test_unshare_archive(
    archive_client: AsyncClient,
    camera: Camera,
    create_email: RandomStringFactory,
    share_with_emails: list[str],
) -> None:
    # Create the archive
    response = await send_post_request(
        archive_client,
        "",
        ArchiveRequest(
            clip_request=ArchiveClip(
                mac_address=camera.mac_address,
                start_time=DEFAULT_START_TIME,
                end_time=DEFAULT_END_TIME,
            ),
            title=FIRST_ARCHIVE_TEXT,
            archive_description=FIRST_DESCRIPTION_TEXT,
            tags=[],
        ),
    )
    archive_id = response.text
    # Share the archive
    await send_post_request(
        archive_client,
        "share",
        ShareArchiveRequest(
            archive_id=archive_id, emails=share_with_emails, sender_email=create_email()
        ),
    )
    # Unshare the archive
    await send_post_request(
        archive_client, f"unshare/{archive_id}", {"email": share_with_emails[0]}
    )


async def test_unshare_archive_with_invalid_inputs(
    archive_client: AsyncClient,
    camera: Camera,
    create_email: RandomStringFactory,
    share_with_emails: list[str],
) -> None:
    # Create the archive
    response = await send_post_request(
        archive_client,
        "",
        ArchiveRequest(
            clip_request=ArchiveClip(
                mac_address=camera.mac_address,
                start_time=DEFAULT_START_TIME,
                end_time=DEFAULT_END_TIME,
            ),
            title=FIRST_ARCHIVE_TEXT,
            archive_description=FIRST_DESCRIPTION_TEXT,
            tags=[],
        ),
    )
    archive_id = int(response.text)
    # Share the archive
    await send_post_request(
        archive_client,
        "share",
        ShareArchiveRequest(
            archive_id=archive_id, emails=share_with_emails, sender_email=create_email()
        ),
    )
    # Unshare the invalid archive id
    response = await send_post_request(
        archive_client,
        f"unshare/{archive_id}{0}",
        {"email": share_with_emails[0]},
        expected_status_code=status.HTTP_400_BAD_REQUEST,
    )

    # Unshare the invalid email
    response = await send_post_request(
        archive_client,
        f"unshare/{archive_id}",
        {"email": create_email()},
        expected_status_code=status.HTTP_400_BAD_REQUEST,
    )


async def test_delete_archive(archive_client: AsyncClient, camera: Camera) -> None:
    response = await send_post_request(
        archive_client,
        "",
        ArchiveRequest(
            clip_request=ArchiveClip(
                mac_address=camera.mac_address,
                start_time=DEFAULT_START_TIME,
                end_time=DEFAULT_END_TIME,
            ),
            title=TEST_ARCHIVE_TEXT,
            archive_description="test",
            tags=[],
        ),
    )
    archive_id = response.text
    response = await send_get_request(archive_client, "summary")
    assert len(response.json()) == 1
    # Delete the archive, and check that it's gone
    response = await send_delete_request(archive_client, archive_id)
    response = await send_get_request(archive_client, "summary")
    assert len(response.json()) == 0


async def test_delete_archive_with_invalid_id(archive_client: AsyncClient) -> None:
    # Delete the archive with invalid id
    await send_delete_request(
        archive_client, "0", expected_status_code=status.HTTP_400_BAD_REQUEST
    )


async def test_edit_description_archive(
    archive_client: AsyncClient, camera: Camera
) -> None:
    response = await send_post_request(
        archive_client,
        "",
        ArchiveRequest(
            clip_request=ArchiveClip(
                mac_address=camera.mac_address,
                start_time=DEFAULT_START_TIME,
                end_time=DEFAULT_END_TIME,
            ),
            title=TEST_ARCHIVE_TEXT,
            archive_description="test",
            tags=[],
        ),
    )
    archive_id = response.text
    await send_post_request(
        archive_client,
        f"update_description/{archive_id}",
        {"description": "new description"},
    )
    response = await send_get_request(archive_client, "summary")
    summaries = [ArchiveSummaryResponse.parse_obj(el) for el in response.json()]
    assert len(summaries) == 1
    assert summaries[0].description == "new description"


async def test_edit_description_archive_wrong_id(archive_client: AsyncClient) -> None:
    await send_post_request(
        archive_client,
        "update_description/1",
        {"description": "new description"},
        expected_status_code=status.HTTP_400_BAD_REQUEST,
    )


async def test_edit_description_archive_wrong_user(
    app: FastAPI,
    archive_client: AsyncClient,
    camera: Camera,
    create_app_user: AppUserFactory,
) -> None:
    response = await send_post_request(
        archive_client,
        "",
        ArchiveRequest(
            clip_request=ArchiveClip(
                mac_address=camera.mac_address,
                start_time=DEFAULT_START_TIME,
                end_time=DEFAULT_END_TIME,
            ),
            title=TEST_ARCHIVE_TEXT,
            archive_description="test",
            tags=[],
        ),
    )
    # Overwrite app user to be a new limited user different from the one created
    # the archive
    new_user = await create_app_user(role=auth.UserRole.LIMITED)
    app.dependency_overrides[auth.limited_user_role_guard] = lambda: new_user

    archive_id = response.text
    await send_post_request(
        archive_client,
        f"update_description/{archive_id}",
        {"description": "new description"},
        expected_status_code=status.HTTP_400_BAD_REQUEST,
    )


async def test_edit_description_archive_another_wrong_user(
    app: FastAPI,
    create_email: RandomStringFactory,
    archive_client: AsyncClient,
    camera: Camera,
    app_user: auth_models.AppUser,
) -> None:
    response = await send_post_request(
        archive_client,
        "",
        ArchiveRequest(
            clip_request=ArchiveClip(
                mac_address=camera.mac_address,
                start_time=DEFAULT_START_TIME,
                end_time=DEFAULT_END_TIME,
            ),
            title=TEST_ARCHIVE_TEXT,
            archive_description="test",
            tags=[],
        ),
    )

    # Overwrite app user to be a limited user with different email than
    # the archive owner
    new_app_user = app_user.copy(
        update={"user_email": create_email(), "role": auth.UserRole.LIMITED}
    )
    app.dependency_overrides[auth.limited_user_role_guard] = lambda: new_app_user

    archive_id = response.text
    response = await send_post_request(
        archive_client,
        f"update_description/{archive_id}",
        {"description": "new description"},
        expected_status_code=status.HTTP_400_BAD_REQUEST,
    )

    # Reset app user to be the original owner and check that the description
    # was not updated
    app.dependency_overrides[auth.limited_user_role_guard] = lambda: app_user
    response = await send_get_request(archive_client, "summary")
    summaries = [ArchiveSummaryResponse.parse_obj(el) for el in response.json()]
    assert len(summaries) == 1
    assert summaries[0].description == "test"


async def test_edit_description_archive_admin_user(
    app: FastAPI,
    create_email: RandomStringFactory,
    archive_client: AsyncClient,
    camera: Camera,
    app_user: auth_models.AppUser,
) -> None:
    response = await send_post_request(
        archive_client,
        "",
        ArchiveRequest(
            clip_request=ArchiveClip(
                mac_address=camera.mac_address,
                start_time=DEFAULT_START_TIME,
                end_time=DEFAULT_END_TIME,
            ),
            title=TEST_ARCHIVE_TEXT,
            archive_description="test",
            tags=[],
        ),
    )
    # Overwrite app user to be a admin user different than the archive owner
    admin_app_user = app_user.copy(
        update={"user_email": create_email(), "role": auth.UserRole.ADMIN}
    )
    app.dependency_overrides[auth.limited_user_role_guard] = lambda: admin_app_user

    archive_id = response.text
    await send_post_request(
        archive_client,
        f"update_description/{archive_id}",
        {"description": "new description"},
    )
    # Reset app user to be the original owner and check that the description was updated
    app.dependency_overrides[auth.limited_user_role_guard] = lambda: app_user
    response = await send_get_request(archive_client, "summary")
    summaries = [ArchiveSummaryResponse.parse_obj(el) for el in response.json()]
    assert len(summaries) == 1
    assert summaries[0].description == "new description"


# TODO(@lberg): refactor when we refactor fixture for archives
async def test_retrieve_archive_clip_thumbnails(
    archive_client: AsyncClient,
    db_instance: database.Database,
    camera: Camera,
    organization: Organization,
    app_user: auth_models.AppUser,
) -> None:
    start_time = AwareDatetime.from_datetime_str("2021-01-01T00:00:00+00:00")
    end_time = AwareDatetime.from_datetime_str("2021-01-01T00:00:10+00:00")

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        archive = await orm.Archive.create_archive(
            session, _default_archive_create(EmailStr(app_user.user_email))
        )
        await session.flush()
        clip_data = await orm.ClipData.create_or_retrieve_clip_data(
            session,
            models.ClipDataCreate(
                mac_address=camera.mac_address,
                start_time=start_time,
                end_time=end_time,
                creation_time=start_time,
            ),
        )
        await orm.Archive.add_clip_to_archive(
            session, archive.id, clip_data, app_user.user_email
        )

    async with db_instance.session() as session:
        requests = _generate_archive_thumbnails(timestamps=[start_time, end_time])
        await _add_archive_thumbnail_batch(
            db_instance, organization.tenant, clip_data.id, requests
        )

    response = await send_get_request(
        archive_client, f"{archive.id}/clip/{clip_data.id}/thumbnails"
    )
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 2


async def test_retrieve_archive_clip_thumbnails_no_results(
    archive_client: AsyncClient,
    db_instance: database.Database,
    camera: Camera,
    organization: Organization,
    app_user: auth_models.AppUser,
) -> None:
    start_time = AwareDatetime.from_datetime_str("2021-01-01T00:00:00+00:00")
    end_time = AwareDatetime.from_datetime_str("2021-01-01T00:00:10+00:00")

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        archive = await orm.Archive.create_archive(
            session, _default_archive_create(EmailStr(app_user.user_email))
        )
        clip_data = await orm.ClipData.create_or_retrieve_clip_data(
            session,
            models.ClipDataCreate(
                mac_address=camera.mac_address,
                start_time=start_time,
                end_time=end_time,
                creation_time=start_time,
            ),
        )
        await orm.Archive.add_clip_to_archive(
            session, archive.id, clip_data, app_user.user_email
        )

    response = await send_get_request(
        archive_client, f"{archive.id}/clip/{clip_data.id}/thumbnails"
    )
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 0


async def test_add_and_remove_tag_from_archive(
    app: FastAPI, archive_client: AsyncClient, camera: Camera, tag: Tag
) -> None:
    archive_response = await send_post_request(
        archive_client,
        "",
        ArchiveRequest(
            clip_request=ArchiveClip(
                mac_address=camera.mac_address,
                start_time=DEFAULT_START_TIME,
                end_time=DEFAULT_END_TIME,
            ),
            title=TEST_ARCHIVE_TEXT,
            archive_description="test",
            tags=[],
        ),
    )
    archive_id = archive_response.text

    await send_post_request(
        archive_client, f"{archive_id}/tags", SetArchiveTagsRequest(tag_ids=[tag.id])
    )

    archives_response = await send_get_request(archive_client, "/user_archives")
    archives = [ArchiveResponse.parse_obj(a) for a in archives_response.json()]
    assert len(archives) == 1
    assert len(archives[0].tags) == 1

    await send_post_request(
        archive_client, f"{archive_id}/tags", SetArchiveTagsRequest(tag_ids=[])
    )

    archives_response = await send_get_request(archive_client, "/user_archives")
    archives = [ArchiveResponse.parse_obj(a) for a in archives_response.json()]
    assert len(archives) == 1
    assert len(archives[0].tags) == 0
