import datetime

import pytest
from fastapi import HTTPException
from pydantic import EmailStr

import backend.database.models as models
from backend.archive.utils import (
    check_user_can_access_archive,
    get_user_archives,
    retrieve_comment_responses,
)
from backend.database import database, orm
from backend.database.organization_models import Organization
from backend.utils import AwareDatetime

DEFAULT_OWNER_USER_EMAIL = EmailStr("owner@test.com")
DEFAULT_CREATION_TIME = AwareDatetime(2023, 4, 27, 12, 00, tzinfo=datetime.timezone.utc)
DEFAULT_START_TIME = AwareDatetime(2022, 11, 20, 12, 00, tzinfo=datetime.timezone.utc)
DEFAULT_END_TIME = DEFAULT_START_TIME + datetime.timedelta(minutes=1)


def _default_archive_create(
    owner_user_email: EmailStr = DEFAULT_OWNER_USER_EMAIL,
) -> models.ArchiveCreate:
    return models.ArchiveCreate(
        owner_user_email=owner_user_email,
        creation_time=DEFAULT_CREATION_TIME,
        title="Test Archive",
        description="test",
        tags=[],
    )


async def test_retrieve_user_archives(
    db_instance: database.Database, organization: Organization
) -> None:
    owner_emails = [EmailStr("user1@test.com"), EmailStr("user2@test.com")]
    share_with_emails = [
        [EmailStr("user3@test.com"), EmailStr("user4@test.com")],
        [EmailStr("user1@test.com"), EmailStr("user3@test.com")],
    ]

    app_user1_email = "user1@test.com"
    app_user2_email = "user2@test.com"
    app_user3_email = "user3@test.com"
    app_user4_email = "user4@test.com"

    archives = []
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        for i, owner_email in enumerate(owner_emails):
            archive = await orm.Archive.create_archive(
                session, _default_archive_create(owner_user_email=owner_email)
            )
            await session.flush()
            for user_email in share_with_emails[i]:
                await orm.SharedArchive.share_archive(
                    session,
                    models.SharedArchiveCreate(
                        archive_id=archive.id, user_email=user_email
                    ),
                    user_email=owner_email,
                )
            archives.append(archive)
        # Retrieve archives for user1
        archive_response = await get_user_archives(
            session=session, user_email=app_user1_email, valid_clips_only=False
        )
        assert (
            len(archive_response) == 2
        ), f"Expect 2 archives, got {len(archive_response)}"
        assert archive_response[0].owner_user_email == owner_emails[0]
        assert archive_response[1].owner_user_email == owner_emails[1]
        assert (
            len(archive_response[0].share_infos) == 2
        ), f"Expect 2 shares infos, got {len(archive_response[0].share_infos)}"
        assert archive_response[0].share_infos[0].user_email in share_with_emails[0]
        assert archive_response[0].share_infos[1].user_email in share_with_emails[0]
        assert (
            len(archive_response[1].share_infos) == 2
        ), f"Expect 2 share info, got {len(archive_response[1].share_infos)}"
        assert archive_response[1].share_infos[0].user_email in share_with_emails[1]
        assert archive_response[1].share_infos[1].user_email in share_with_emails[1]

        archive_response = await get_user_archives(
            session=session, user_email=app_user1_email, valid_clips_only=True
        )
        assert (
            len(archive_response) == 0
        ), f"Expect 0 archives, got {len(archive_response)}"

        # Retrieve archives for user2
        archive_response = await get_user_archives(
            session=session, user_email=app_user2_email, valid_clips_only=False
        )
        assert (
            len(archive_response) == 1
        ), f"Expect 1 archive, got {len(archive_response)}"
        assert archive_response[0].owner_user_email == owner_emails[1]
        assert (
            len(archive_response[0].share_infos) == 2
        ), f"Expect 2 shares infos, got {len(archive_response[0].share_infos)}"
        assert archive_response[0].share_infos[0].user_email in share_with_emails[1]
        assert archive_response[0].share_infos[1].user_email in share_with_emails[1]
        # Retrieve archives for user3
        archive_response = await get_user_archives(
            session=session, user_email=app_user3_email, valid_clips_only=False
        )
        assert len(archive_response) == 2
        assert len(archive_response[0].share_infos) == 2
        assert len(archive_response[1].share_infos) == 2
        # Retrieve archives for user4
        archive_response = await get_user_archives(
            session=session, user_email=app_user4_email, valid_clips_only=False
        )
        assert len(archive_response) == 1
        assert len(archive_response[0].share_infos) == 2


async def test_check_user_can_access_archive_owned(
    db_instance: database.Database, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        archive = await orm.Archive.create_archive(session, _default_archive_create())
        await session.flush()

        await check_user_can_access_archive(
            session, DEFAULT_OWNER_USER_EMAIL, archive.id
        )


async def test_check_user_can_access_archive_shared(
    db_instance: database.Database, organization: Organization
) -> None:
    share_with_email = EmailStr("another_user@test.com")
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        archive = await orm.Archive.create_archive(session, _default_archive_create())
        await session.flush()
        await orm.SharedArchive.share_archive(
            session,
            models.SharedArchiveCreate(
                archive_id=archive.id, user_email=share_with_email
            ),
            user_email=DEFAULT_OWNER_USER_EMAIL,
        )
        await check_user_can_access_archive(session, share_with_email, archive.id)


async def test_check_user_can_access_archive_not_allowed(
    db_instance: database.Database, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        archive = await orm.Archive.create_archive(session, _default_archive_create())
        await session.flush()

        with pytest.raises(HTTPException):
            await check_user_can_access_archive(
                session, EmailStr("another_user@test.com"), archive.id
            )


async def test_retrieve_comment_responses() -> None:
    comments = [
        models.ArchiveComment(
            id=1,
            user_email=DEFAULT_OWNER_USER_EMAIL,
            comment="test",
            creation_time=DEFAULT_CREATION_TIME,
        ),
        models.ArchiveComment(
            id=2,
            user_email=DEFAULT_OWNER_USER_EMAIL,
            comment="test",
            creation_time=DEFAULT_CREATION_TIME + datetime.timedelta(minutes=1),
        ),
    ]
    clips = [
        # This clip should be linked to the first comment
        models.ArchiveClipData(
            clip_id=1,
            archive_id=1,
            creation_time=DEFAULT_CREATION_TIME,
            clip_creator_email=DEFAULT_OWNER_USER_EMAIL,
            clip=models.ClipData(
                mac_address="00:00:00:00:00:00",
                start_time=DEFAULT_START_TIME,
                end_time=DEFAULT_END_TIME,
                creation_time=DEFAULT_CREATION_TIME,
                id=1,
            ),
        ),
        # This clip should not be linked to any comment
        models.ArchiveClipData(
            clip_id=2,
            archive_id=2,
            creation_time=DEFAULT_CREATION_TIME + datetime.timedelta(minutes=2),
            clip_creator_email=DEFAULT_OWNER_USER_EMAIL,
            clip=models.ClipData(
                mac_address="00:00:00:00:00:00",
                start_time=DEFAULT_START_TIME,
                end_time=DEFAULT_END_TIME,
                creation_time=DEFAULT_CREATION_TIME,
                id=2,
            ),
        ),
    ]
    responses = retrieve_comment_responses(comments, clips)
    assert len(responses) == len(comments)
    assert responses[0].comment == comments[0]
    assert responses[0].attached_clip_data == clips[0]
    assert responses[1].comment == comments[1]
    assert responses[1].attached_clip_data is None


@pytest.mark.parametrize(
    "offset_creation",
    [(datetime.timedelta(milliseconds=-100)), (datetime.timedelta(milliseconds=100))],
)
async def test_retrieve_comment_responses_single_comment_before_and_after(
    offset_creation: datetime.timedelta,
) -> None:
    comments = [
        models.ArchiveComment(
            id=1,
            user_email=DEFAULT_OWNER_USER_EMAIL,
            comment="test",
            creation_time=DEFAULT_CREATION_TIME,
        )
    ]
    clips = [
        # This clip should be linked to the first comment
        models.ArchiveClipData(
            clip_id=1,
            archive_id=1,
            creation_time=DEFAULT_CREATION_TIME + offset_creation,
            clip_creator_email=DEFAULT_OWNER_USER_EMAIL,
            clip=models.ClipData(
                mac_address="00:00:00:00:00:00",
                start_time=DEFAULT_START_TIME,
                end_time=DEFAULT_END_TIME,
                creation_time=DEFAULT_CREATION_TIME,
                id=1,
            ),
        )
    ]
    responses = retrieve_comment_responses(comments, clips)
    assert len(responses) == len(comments)
    assert responses[0].comment == comments[0]
    assert responses[0].attached_clip_data == clips[0]
