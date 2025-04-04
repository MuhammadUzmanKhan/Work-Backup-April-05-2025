import pytest
from pydantic import EmailStr

from backend import auth_models
from backend.database import database, models, orm
from backend.database.models import LicensePlate
from backend.database.organization_models import Organization
from backend.database.orm.orm_license_plate_alert_profile import (
    LicensePlateAlertProfileError,
    LicensePlateAlertProfileNotFoundError,
)
from backend.s3_utils import S3Path
from backend.test.factory_types import NotificationGroupFactory, RandomStringFactory
from backend.utils import AwareDatetime


async def test_add_alert_profile(
    db_instance: database.Database,
    app_user: auth_models.AppUser,
    organization: Organization,
    create_s3_url: RandomStringFactory,
    license_plate: LicensePlate,
) -> None:
    alert_profile_create = models.LicensePlateAlertProfileCreate(
        license_plate_number=license_plate.license_plate_number,
        owner_user_email=EmailStr(app_user.user_email),
        creation_time=AwareDatetime.utcnow(),
        image_s3_path=S3Path(create_s3_url()),
        x_min=0,
        y_min=0,
        x_max=1,
        y_max=1,
    )
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        profile_id = await orm.LicensePlateAlertProfile.add_profile(
            session=session, alert_profile_create=alert_profile_create
        )
        alert_profiles = await orm.LicensePlateAlertProfile.get_profiles(session)
    assert len(alert_profiles) == 1
    assert alert_profiles[0].id == profile_id
    assert alert_profile_create == models.LicensePlateAlertProfileCreate(
        **alert_profiles[0].dict()
    )


async def test_update_notification_groups(
    db_instance: database.Database,
    create_notification_groups: NotificationGroupFactory,
    organization: Organization,
    license_plate_alert_profile: models.LicensePlateAlertProfile,
) -> None:
    # Create notification groups
    notification_groups = await create_notification_groups(
        tenant=organization.tenant, num_groups=5
    )
    # Update the notification groups for the license plate alert profile
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.LicensePlateAlertProfile.update_notification_groups(
            session=session,
            alert_profile_id=license_plate_alert_profile.id,
            notification_group_ids={group.id for group in notification_groups},
        )
        profiles = await orm.LicensePlateAlertProfile.get_profiles(
            session=session, profile_ids={license_plate_alert_profile.id}
        )
        assert len(profiles) == 1, "Expected one profile"
        updated_profile = profiles[0]

    # Prepare the expected profile with the new notification groups
    expected_profile = license_plate_alert_profile.copy()
    expected_profile.notification_groups = notification_groups

    # Assert that the updated profile with the new notification groups is the same as
    # the expected profile
    assert updated_profile == expected_profile


async def test_update_notification_groups_with_invalid_group_ids(
    db_instance: database.Database,
    create_notification_groups: NotificationGroupFactory,
    organization: Organization,
    license_plate_alert_profile: models.LicensePlateAlertProfile,
) -> None:
    # Create notification groups
    notification_groups = await create_notification_groups(
        tenant=organization.tenant, num_groups=5
    )
    # Update the notification groups for the license plate alert profile
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        with pytest.raises(LicensePlateAlertProfileError):
            await orm.LicensePlateAlertProfile.update_notification_groups(
                session=session,
                alert_profile_id=license_plate_alert_profile.id,
                notification_group_ids={group.id + 1 for group in notification_groups},
            )


async def test_delete_profile(
    db_instance: database.Database,
    organization: Organization,
    license_plate_alert_profile: models.LicensePlateAlertProfile,
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        # Ensure there is initially one alert profile
        alert_profiles = await orm.LicensePlateAlertProfile.get_profiles(session)
        assert len(alert_profiles) == 1

        # Delete the alert profile
        await orm.LicensePlateAlertProfile.delete_profile(
            session=session, alert_profile_id=license_plate_alert_profile.id
        )
        alert_profiles = await orm.LicensePlateAlertProfile.get_profiles(session)

        # Verify that there are no alert profiles after deletion
        assert len(alert_profiles) == 0


async def test_delete_profile_with_empty_profiles(
    db_instance: database.Database, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        # Ensure there is initially one alert profile
        alert_profiles = await orm.LicensePlateAlertProfile.get_profiles(session)
        assert len(alert_profiles) == 0

        # Expect the deletion to fail
        with pytest.raises(LicensePlateAlertProfileNotFoundError):
            await orm.LicensePlateAlertProfile.delete_profile(
                session=session, alert_profile_id=1
            )
