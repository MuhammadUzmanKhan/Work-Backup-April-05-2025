import datetime

import pytest
from pydantic import EmailStr
from sqlalchemy import exc

import backend.database.models as models
from backend.database import database, orm
from backend.database.organization_models import Organization
from backend.utils import AwareDatetime

DEFAULT_OWNER_USER_EMAIL = EmailStr("owner@test.com")
DEFAULT_CREATION_TIME = AwareDatetime(2023, 4, 27, 12, 00, tzinfo=datetime.timezone.utc)
DEFAULT_START_TIME = AwareDatetime(2022, 11, 20, 12, 00, tzinfo=datetime.timezone.utc)
DEFAULT_END_TIME = DEFAULT_START_TIME + datetime.timedelta(minutes=1)


async def test_create_shared_video(
    db_instance: database.Database, organization: Organization, camera: models.Camera
) -> None:
    expiration_time = AwareDatetime(2029, 4, 27, 12, 00, tzinfo=datetime.timezone.utc)
    clip_data = models.ClipDataCreate(
        mac_address=camera.mac_address,
        start_time=DEFAULT_START_TIME,
        end_time=DEFAULT_END_TIME,
        creation_time=DEFAULT_CREATION_TIME,
        expiration_time=expiration_time,
    )
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        clip = await orm.ClipData.create_or_retrieve_clip_data(session, clip_data)
        await session.flush()
        shared_video_unique_hash = await orm.SharedVideo.create_shared_video(
            session,
            models.SharedVideoCreate(
                user_name="test",
                clip_id=clip.id,
                expiration_time=expiration_time,
                email_address=EmailStr("test@test.com"),
            ),
        )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        # Check that the shared video exists in the DB
        video_exists = await orm.SharedVideo.system_shared_video_exists_by_hash(
            session, shared_video_unique_hash
        )
        assert video_exists, "Shared video should exist in the DB"

        # Check that the shared video can be retrieved from the DB
        shared_video_model = await orm.SharedVideo.system_get_shared_video(
            session, shared_video_unique_hash
        )
        assert shared_video_model is not None
        assert shared_video_model.clip is not None


async def test_create_shared_video_with_invalid_hash(
    db_instance: database.Database, organization: Organization
) -> None:
    unique_hash = "invalid_hash"

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        # Check that the shared video with invalid hash does not exist in the DB
        video_exists = await orm.SharedVideo.system_shared_video_exists_by_hash(
            session, unique_hash
        )
        assert video_exists is False, "Shared video should not exist in the DB"

        # Check that the shared video with invalid hash cannot be retrieved from the DB
        with pytest.raises(exc.NoResultFound):
            await orm.SharedVideo.system_get_shared_video(session, unique_hash)


async def test_get_expired_shared_video(
    db_instance: database.Database, organization: Organization, camera: models.Camera
) -> None:
    expiration_time = AwareDatetime(2000, 4, 27, 12, 00, tzinfo=datetime.timezone.utc)
    clip_data = models.ClipDataCreate(
        mac_address=camera.mac_address,
        start_time=DEFAULT_START_TIME,
        end_time=DEFAULT_END_TIME,
        creation_time=DEFAULT_CREATION_TIME,
        expiration_time=expiration_time,
    )
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        clip = await orm.ClipData.create_or_retrieve_clip_data(session, clip_data)
        await session.flush()
        shared_video_unique_hash = await orm.SharedVideo.create_shared_video(
            session,
            models.SharedVideoCreate(
                user_name="test",
                clip_id=clip.id,
                expiration_time=expiration_time,
                email_address=EmailStr("test@test.com"),
            ),
        )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        # Check that the expired video cannot be retrieved from the DB
        with pytest.raises(orm.SharedVideoExpiredError):
            await orm.SharedVideo.system_get_shared_video(
                session, shared_video_unique_hash
            )
