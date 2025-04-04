import datetime

from httpx import AsyncClient
from pydantic import EmailStr, HttpUrl

from backend import auth_models
from backend.database import database, orm
from backend.database.face_models import (
    NVRUniqueFace,
    OrgUniqueFaceIdentifier,
    UniqueFaceOccurrence,
)
from backend.database.models import (
    NVR,
    Camera,
    FaceAlertProfile,
    FaceAlertProfileIdentifier,
    Location,
)
from backend.database.organization_models import Organization
from backend.face.models import FaceOccurrenceResponse
from backend.face_alert.models import (
    FaceAlertProfileRequest,
    FaceAlertProfileResponse,
    FaceAlertResponse,
    FaceAlertsDiscoveryRequest,
    OptionalFaceAlertProfileResponse,
    RegisterFaceAlertProfileRequest,
)
from backend.test.client_request import (
    send_delete_request,
    send_get_request,
    send_post_request,
)
from backend.test.factory_types import (
    FaceAlertProfileFactory,
    FaceOccurrenceFactory,
    NotificationGroupFactory,
)
from backend.utils import AwareDatetime

DEFAULT_S3_PATH = "s3://test-bucket/test-path"


async def test_register_unique_face_alert_profile(
    face_alert_client: AsyncClient, nvr_unique_face: NVRUniqueFace
) -> None:
    await send_post_request(
        face_alert_client,
        "register_alert_profile",
        RegisterFaceAlertProfileRequest(
            description="test",
            is_person_of_interest=False,
            org_unique_face_id=nvr_unique_face.org_unique_face_id,
        ),
    )


async def test_get_alert_profiles(
    face_alert_client: AsyncClient,
    create_face_alert_profile: FaceAlertProfileFactory,
    app_user: auth_models.AppUser,
    camera: Camera,
) -> None:
    # Register alert settings
    email_list = [EmailStr("user1@test.com"), EmailStr("user2@test.com")]
    for email in email_list:
        await create_face_alert_profile(app_user.tenant, email)

    # Get alert settings
    response = await send_get_request(face_alert_client, "alert_profiles")
    # Check response
    assert len(response.json()) == len(email_list)

    for idx, email in enumerate(email_list):
        parsed_response = FaceAlertProfileResponse.parse_obj(response.json()[idx])
        assert parsed_response.alert_profile.owner_user_email == email


async def test_update_profile_description(
    face_alert_client: AsyncClient, face_alert_profile: FaceAlertProfile
) -> None:
    # Update alert setting description
    await send_post_request(
        face_alert_client,
        f"update_profile_description/{face_alert_profile.id}",
        {"description": "this is a test"},
    )

    # Check updated alert setting
    response = await send_get_request(face_alert_client, "alert_profiles")
    assert len(response.json()) == 1

    parsed_response = FaceAlertProfileResponse.parse_obj(response.json()[0])
    assert parsed_response.alert_profile.description == "this is a test"


async def test_update_person_of_interest_flag(
    face_alert_client: AsyncClient, face_alert_profile: FaceAlertProfile
) -> None:
    # Update alert enabled flag
    await send_post_request(
        face_alert_client,
        f"update_person_of_interest_flag/{face_alert_profile.id}",
        {"is_person_of_interest": True},
    )

    # Check updated alert setting
    response = await send_get_request(face_alert_client, "alert_profiles")
    assert len(response.json()) == 1
    parsed_response = FaceAlertProfileResponse.parse_obj(response.json()[0])
    assert parsed_response.alert_profile.is_person_of_interest is True

    # Update alert enabled flag
    await send_post_request(
        face_alert_client,
        f"update_person_of_interest_flag/{face_alert_profile.id}",
        {"is_person_of_interest": False},
    )
    # Check updated alert setting
    response = await send_get_request(face_alert_client, "alert_profiles")
    assert len(response.json()) == 1

    parsed_response = FaceAlertProfileResponse.parse_obj(response.json()[0])
    assert parsed_response.alert_profile.is_person_of_interest is False


async def test_update_notification_groups(
    app_user: auth_models.AppUser,
    face_alert_client: AsyncClient,
    face_alert_profile: FaceAlertProfile,
    create_notification_groups: NotificationGroupFactory,
) -> None:
    # Create notification groups
    notification_groups = await create_notification_groups(
        tenant=app_user.tenant, num_groups=2
    )
    notification_group_ids = {group.id for group in notification_groups}

    # Update notification groups for the face alert profile
    await send_post_request(
        face_alert_client,
        f"update_notification_groups/{face_alert_profile.id}",
        {"notification_group_ids": notification_group_ids},
    )

    # Check updated face alert profile
    response = await send_get_request(face_alert_client, "alert_profiles")
    assert len(response.json()) == 1
    parsed_response = FaceAlertProfileResponse.parse_obj(response.json()[0])
    assert {
        group.id for group in parsed_response.alert_profile.notification_groups
    } == notification_group_ids


async def test_delete_alert_profile(
    face_alert_client: AsyncClient, face_alert_profile: FaceAlertProfile
) -> None:
    # Delete alert setting
    await send_delete_request(
        face_alert_client, f"delete_alert_profile/{face_alert_profile.id}"
    )

    # Check deleted alert setting
    response = await send_get_request(face_alert_client, "alert_profiles")
    assert len(response.json()) == 0


async def test_get_alert_occurrences_simple(
    face_alert_client: AsyncClient,
    face_alert_profile: FaceAlertProfile,
    nvr: NVR,
    camera: Camera,
    location: Location,
    nvr_unique_face: NVRUniqueFace,
    create_face_occurrence: FaceOccurrenceFactory,
) -> None:
    # Create face occurrence
    face_occurrence = await create_face_occurrence(
        nvr_uuid=nvr.uuid,
        mac_address=camera.mac_address,
        unique_face_id=nvr_unique_face.nvr_unique_face_id,
    )

    # Get alert occurrences
    response = await send_post_request(
        face_alert_client,
        f"alert_occurrences/{face_alert_profile.id}",
        FaceAlertsDiscoveryRequest(
            start_time=AwareDatetime.utcnow() - datetime.timedelta(hours=2),
            end_time=AwareDatetime.utcnow(),
            mac_addresses={camera.mac_address},
            location_ids={location.id},
        ),
    )
    # Check response
    parsed_response = FaceOccurrenceResponse.parse_obj(response.json()[0])
    assert len(response.json()) == 1
    assert parsed_response == FaceOccurrenceResponse(
        **face_occurrence.dict(),
        person_s3_signed_url=parsed_response.person_s3_signed_url,
    )
    assert isinstance(parsed_response.person_s3_signed_url, HttpUrl)


async def test_get_alert_occurrences_without_face_occurrences(
    face_alert_client: AsyncClient,
    face_alert_profile: FaceAlertProfile,
    camera: Camera,
    location: Location,
) -> None:
    # Get alert occurrences
    response = await send_post_request(
        face_alert_client,
        f"alert_occurrences/{face_alert_profile.id}",
        FaceAlertsDiscoveryRequest(
            start_time=AwareDatetime.utcnow() - datetime.timedelta(hours=2),
            end_time=AwareDatetime.utcnow(),
            mac_addresses={camera.mac_address},
            location_ids={location.id},
        ),
    )
    # Check response
    assert len(response.json()) == 0


async def test_get_latest_poi_alert_occurrences_simple(
    face_alert_client: AsyncClient,
    db_instance: database.Database,
    face_alert_profile: FaceAlertProfile,
    nvr: NVR,
    camera: Camera,
    location: Location,
    create_face_occurrence: FaceOccurrenceFactory,
    organization: Organization,
    nvr_unique_face: NVRUniqueFace,
) -> None:
    # Create face occurrence
    face_occurrence = await create_face_occurrence(
        nvr_uuid=nvr.uuid,
        mac_address=camera.mac_address,
        unique_face_id=nvr_unique_face.nvr_unique_face_id,
    )
    # Get POI alert occurrences
    response = await send_post_request(
        face_alert_client,
        "latest_person_of_interest_alert_occurrences",
        FaceAlertsDiscoveryRequest(
            start_time=AwareDatetime.utcnow() - datetime.timedelta(hours=2),
            end_time=AwareDatetime.utcnow(),
            mac_addresses={camera.mac_address},
            location_ids={location.id},
        ),
    )

    assert len(response.json()) == 0

    # Update person of interest flag
    await send_post_request(
        face_alert_client,
        f"update_person_of_interest_flag/{face_alert_profile.id}",
        {"is_person_of_interest": True},
    )

    # Get POI alert occurrences
    response = await send_post_request(
        face_alert_client,
        "latest_person_of_interest_alert_occurrences",
        FaceAlertsDiscoveryRequest(
            start_time=AwareDatetime.utcnow() - datetime.timedelta(hours=2),
            end_time=AwareDatetime.utcnow(),
            mac_addresses={camera.mac_address},
            location_ids={location.id},
        ),
    )
    assert len(response.json()) == 1

    parsed_response = FaceAlertResponse.parse_obj(response.json()[0])

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        cameras = await orm.Camera.get_cameras_from_mac_addresses(
            session=session, mac_addresses={camera.mac_address}
        )
    assert len(cameras) == 1
    assert parsed_response == FaceAlertResponse(
        unique_face_occurrence=UniqueFaceOccurrence(
            org_unique_face_id=face_alert_profile.org_unique_face.id,
            s3_path=nvr_unique_face.s3_path,
            mac_address=face_occurrence.camera_mac_address,
            occurrence_time=face_occurrence.occurrence_time,
        ),
        camera=cameras[0],
        face_profile_id=face_alert_profile.id,
        description=face_alert_profile.description,
        notification_groups=face_alert_profile.notification_groups,
        face_profile_s3_signed_url=parsed_response.face_profile_s3_signed_url,
    )
    assert isinstance(parsed_response.face_profile_s3_signed_url, HttpUrl)


async def test_get_latest_poi_alert_occurrences_without_alert_profiles(
    face_alert_client: AsyncClient,
    nvr: NVR,
    camera: Camera,
    location: Location,
    create_face_occurrence: FaceOccurrenceFactory,
) -> None:
    # Create face occurrence
    await create_face_occurrence(nvr.uuid, camera.mac_address)

    # Get POI alert occurrences
    response = await send_post_request(
        face_alert_client,
        "latest_person_of_interest_alert_occurrences",
        FaceAlertsDiscoveryRequest(
            start_time=AwareDatetime.utcnow() - datetime.timedelta(hours=2),
            end_time=AwareDatetime.utcnow(),
            mac_addresses={camera.mac_address},
            location_ids={location.id},
        ),
    )
    # Check response, expect no alert occurrences since no alert profiles are registered
    assert len(response.json()) == 0


async def test_get_face_alert_profile_by_unique_face_id(
    face_alert_client: AsyncClient,
    app_user: auth_models.AppUser,
    create_face_alert_profile: FaceAlertProfileFactory,
) -> None:
    # Register face alert profile
    face_alert_profile = await create_face_alert_profile(
        app_user.tenant, EmailStr(app_user.user_email)
    )
    # Get profile identifier from unique face id
    unique_face_id = face_alert_profile.org_unique_face.id
    profile_identifier = OrgUniqueFaceIdentifier(org_unique_face_id=unique_face_id)
    # Get face alert profile using profile identifier
    response = await send_post_request(
        face_alert_client,
        "alert_profile",
        FaceAlertProfileRequest(profile_identifier=profile_identifier),
    )
    parsed_response = OptionalFaceAlertProfileResponse.parse_obj(response.json())

    # Expect returned face alert profile to be the same as the one registered
    assert parsed_response.alert_profile_response is not None
    assert parsed_response.alert_profile_response.alert_profile == face_alert_profile


async def test_get_face_alert_profile_by_face_alert_profile_id(
    face_alert_client: AsyncClient,
    app_user: auth_models.AppUser,
    nvr: NVR,
    create_face_alert_profile: FaceAlertProfileFactory,
) -> None:
    # Register face alert profile
    face_alert_profile = await create_face_alert_profile(
        app_user.tenant, EmailStr(app_user.user_email)
    )
    # Get profile identifier from face alert profile id
    profile_identifier = FaceAlertProfileIdentifier(
        alert_profile_id=face_alert_profile.id
    )
    # Get face alert profile using profile identifier
    response = await send_post_request(
        face_alert_client,
        "alert_profile",
        FaceAlertProfileRequest(profile_identifier=profile_identifier),
    )
    parsed_response = OptionalFaceAlertProfileResponse.parse_obj(response.json())

    # Expect returned face alert profile to be the same as the one registered
    assert parsed_response.alert_profile_response is not None
    assert parsed_response.alert_profile_response.alert_profile == face_alert_profile
