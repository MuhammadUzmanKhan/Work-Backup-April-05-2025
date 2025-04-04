from unittest.mock import MagicMock

from fastapi import FastAPI, status
from httpx import AsyncClient

from backend.database.models import Camera, LicensePlateAlertProfile
from backend.dependencies import get_boto_session_maker
from backend.license_plate_alert.models import RegisterLicencePlateAlertProfileRequest
from backend.license_plate_alert.utils import LicensePlateImageCopyError
from backend.test.client_request import (
    send_delete_request,
    send_get_request,
    send_post_request,
)
from backend.test.factory_types import (
    LicensePlateDetectionFactory,
    LicensePlateFactory,
    RandomStringFactory,
)


async def test_add_license_plate_alert_profile(
    license_plate_alert_client: AsyncClient,
    create_license_plate: LicensePlateFactory,
    create_license_plate_detection: LicensePlateDetectionFactory,
    camera: Camera,
) -> None:
    license_plate = await create_license_plate()
    await create_license_plate_detection(
        mac_address=camera.mac_address,
        license_plate_number=license_plate.license_plate_number,
    )
    await send_post_request(
        license_plate_alert_client,
        "add_alert_profile",
        RegisterLicencePlateAlertProfileRequest(
            license_plate_number=license_plate.license_plate_number
        ),
    )

    is_profile_exists = await send_get_request(
        license_plate_alert_client,
        f"profile_exists/{license_plate.license_plate_number}",
    )
    assert is_profile_exists.json() is True


async def test_add_license_plate_alert_profile_error_pre_task(
    license_plate_alert_client: AsyncClient,
    create_license_plate: LicensePlateFactory,
    create_license_plate_detection: LicensePlateDetectionFactory,
    camera: Camera,
    app: FastAPI,
) -> None:
    license_plate = await create_license_plate()
    await create_license_plate_detection(
        mac_address=camera.mac_address,
        license_plate_number=license_plate.license_plate_number,
    )
    boto_mock = MagicMock()
    boto_mock.client = MagicMock(side_effect=LicensePlateImageCopyError)

    app.dependency_overrides[get_boto_session_maker] = lambda: lambda: boto_mock
    await send_post_request(
        license_plate_alert_client,
        "add_alert_profile",
        RegisterLicencePlateAlertProfileRequest(
            license_plate_number=license_plate.license_plate_number
        ),
        expected_status_code=status.HTTP_400_BAD_REQUEST,
    )


async def test_non_existent_license_plate_alert_profile(
    license_plate_alert_client: AsyncClient,
    create_license_plate_number: RandomStringFactory,
) -> None:
    license_plate_number = create_license_plate_number()
    is_profile_exists = await send_get_request(
        license_plate_alert_client, f"profile_exists/{license_plate_number}"
    )
    assert is_profile_exists.json() is False


async def test_delete_license_plate_alert_profile(
    license_plate_alert_client: AsyncClient,
    license_plate_alert_profile: LicensePlateAlertProfile,
) -> None:
    await send_delete_request(
        license_plate_alert_client,
        f"delete_alert_profile/{license_plate_alert_profile.id}",
    )


async def test_delete_invalid_license_plate_alert_profile(
    license_plate_alert_client: AsyncClient,
) -> None:
    response = await send_delete_request(
        license_plate_alert_client,
        "delete_alert_profile/999999",
        expected_status_code=status.HTTP_400_BAD_REQUEST,
    )
    assert "not found" in response.json()["detail"]
