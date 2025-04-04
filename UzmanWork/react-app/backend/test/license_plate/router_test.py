import datetime

from httpx import AsyncClient

from backend.database import database
from backend.database.models import NVR, LicensePlateTrackInfo
from backend.database.organization_models import Organization
from backend.license_plate.models import (
    LicensePlateResponse,
    LicensePlatesRequest,
    PlateDetectionResult,
    RegisterLicensePlateRequest,
)
from backend.models import AccessRestrictions
from backend.router_utils import get_camera_response_from_mac_address_or_fail
from backend.test.client_request import send_post_request
from backend.utils import AwareDatetime


async def test_license_plate_router(
    db_instance: database.Database,
    license_plate_client: AsyncClient,
    nvr: NVR,
    license_plate_detection_result: PlateDetectionResult,
    register_license_plate_request: RegisterLicensePlateRequest,
    organization: Organization,
) -> None:
    # add single detection
    await send_post_request(
        license_plate_client, "register_image", register_license_plate_request
    )

    request = LicensePlatesRequest(
        start_time=AwareDatetime.utcnow() - datetime.timedelta(hours=1),
        end_time=AwareDatetime.utcnow(),
        mac_addresses={register_license_plate_request.mac_address},
        location_ids={nvr.location_id},
    )

    # try retrieving its track
    response = await send_post_request(license_plate_client, "license_plates", request)
    assert len(response.json()) == 1
    parsed_response = LicensePlateResponse.parse_obj(response.json()[0])

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        camera_response = await get_camera_response_from_mac_address_or_fail(
            session, AccessRestrictions(), register_license_plate_request.mac_address
        )
    assert parsed_response == LicensePlateResponse(
        license_plate=LicensePlateTrackInfo(
            license_plate_number=license_plate_detection_result.plate,
            last_seen=register_license_plate_request.timestamp,
            camera_mac_address=register_license_plate_request.mac_address,
            x_min=license_plate_detection_result.box.xmin,
            y_min=license_plate_detection_result.box.ymin,
            x_max=license_plate_detection_result.box.xmax,
            y_max=license_plate_detection_result.box.ymax,
            image_s3_path=register_license_plate_request.image_s3_path,
            num_occurrences=1,
            location_name=camera_response.location,
            camera_name=camera_response.camera.name,
            alert_profile=None,
        ),
        s3_signed_url="https://examplebucket.s3.amazonaws.com/test.txt",
    )
