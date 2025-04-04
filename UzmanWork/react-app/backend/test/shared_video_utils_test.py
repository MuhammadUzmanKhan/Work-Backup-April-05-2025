import datetime
from datetime import timedelta

from pydantic import EmailStr

from backend.database import database, models, orm
from backend.database.organization_models import Organization
from backend.shared_video_utils import create_shared_video
from backend.test.factory_types import RandomStringFactory
from backend.utils import AwareDatetime

DEFAULT_CREATION_TIME = AwareDatetime(2023, 4, 27, 12, 00, tzinfo=datetime.timezone.utc)
DEFAULT_START_TIME = AwareDatetime(2022, 11, 20, 12, 00, tzinfo=datetime.timezone.utc)
DEFAULT_END_TIME = DEFAULT_START_TIME + datetime.timedelta(minutes=1)


# Create test for create_shared_video
async def test_create_shared_video(
    db_instance: database.Database,
    camera: models.Camera,
    create_name: RandomStringFactory,
    create_email: RandomStringFactory,
    create_phone_number: RandomStringFactory,
    organization: Organization,
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        clip_data = await orm.ClipData.create_or_retrieve_clip_data(
            session,
            models.ClipDataCreate(
                mac_address=camera.mac_address,
                start_time=DEFAULT_START_TIME,
                end_time=DEFAULT_END_TIME,
                creation_time=DEFAULT_CREATION_TIME,
            ),
        )

        shared_video_data = models.SharedVideoCreate(
            user_name=create_name(),
            clip_id=clip_data.id,
            email_address=EmailStr(create_email()),
            phone_number=create_phone_number(),
            expiration_time=AwareDatetime.utcnow() + timedelta(seconds=10),
        )
        shared_video = await create_shared_video(
            session=session, shared_video_data=shared_video_data
        )
    shared_video_base = models.SharedVideoBase(**shared_video.dict())
    shared_video_data_base = models.SharedVideoBase(**shared_video_data.dict())
    assert shared_video_base == shared_video_data_base
    assert shared_video.clip.id == shared_video_data.clip_id
