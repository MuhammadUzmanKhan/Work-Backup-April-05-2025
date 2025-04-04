import datetime

import pytest
from pydantic import EmailStr

from backend.database import database, models, orm
from backend.database.organization_models import Organization
from backend.database.orm.orm_face_alert_profile import (
    DuplicateFaceAlertProfileError,
    FaceAlertProfileNotFoundError,
)
from backend.test.factory_types import NVRUniqueFaceFactory
from backend.utils import AwareDatetime

DEFAULT_OWNER_USER_EMAIL = EmailStr("owner@test.com")
DEFAULT_CREATION_TIME = AwareDatetime(2023, 4, 27, 12, 00, tzinfo=datetime.timezone.utc)
DEFAULT_FACE_S3_PATH = "s3://test_bucket/face.jpg"


async def test_create_face_alert_profile(
    db_instance: database.Database,
    organization: Organization,
    create_nvr_unique_face: NVRUniqueFaceFactory,
    nvr: models.NVR,
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        unique_face = await create_nvr_unique_face(nvr_uuid=nvr.uuid)
        alert_metadata = models.FaceAlertProfileCreate(
            description="test",
            is_person_of_interest=True,
            org_unique_face_id=unique_face.org_unique_face_id,
            owner_user_email=DEFAULT_OWNER_USER_EMAIL,
            creation_time=DEFAULT_CREATION_TIME,
        )

        alert_profile_id = await orm.FaceAlertProfile.new_profile(
            session=session, face_alert_profile=alert_metadata
        )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.FaceAlertProfile.get_profile_by_id(session, alert_profile_id)


async def test_create_face_alert_missing_unique_face(
    db_instance: database.Database, organization: Organization, nvr: models.NVR
) -> None:
    alert_metadata = models.FaceAlertProfileCreate(
        description="test",
        is_person_of_interest=True,
        org_unique_face_id=1,
        owner_user_email=DEFAULT_OWNER_USER_EMAIL,
        creation_time=DEFAULT_CREATION_TIME,
    )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        with pytest.raises(FaceAlertProfileNotFoundError):
            await orm.FaceAlertProfile.new_profile(
                session=session, face_alert_profile=alert_metadata
            )


async def test_create_face_alert_duplicate(
    db_instance: database.Database,
    organization: Organization,
    create_nvr_unique_face: NVRUniqueFaceFactory,
    nvr: models.NVR,
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        unique_face = await create_nvr_unique_face(nvr_uuid=nvr.uuid)

    alert_metadata = models.FaceAlertProfileCreate(
        description="test",
        is_person_of_interest=True,
        org_unique_face_id=unique_face.org_unique_face_id,
        owner_user_email=DEFAULT_OWNER_USER_EMAIL,
        creation_time=DEFAULT_CREATION_TIME,
    )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.FaceAlertProfile.new_profile(
            session=session, face_alert_profile=alert_metadata
        )
        with pytest.raises(DuplicateFaceAlertProfileError):
            await orm.FaceAlertProfile.new_profile(
                session=session, face_alert_profile=alert_metadata
            )
