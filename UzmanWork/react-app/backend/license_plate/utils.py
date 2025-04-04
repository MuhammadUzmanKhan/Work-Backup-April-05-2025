import datetime
import logging

import aiohttp
import sentry_sdk
from fastapi.encoders import jsonable_encoder
from pydantic import ValidationError
from pydantic.tools import parse_obj_as

from backend import logging_config
from backend.alert.alert_models import (
    LicensePlateAlertOccurrence,
    LicensePlateAlertsSendRequest,
)
from backend.database import database, models, orm
from backend.database.session import TenantAwareAsyncSession
from backend.envs import BackendSecrets
from backend.license_plate.models import (
    LicensePlateDetectionError,
    PlateRecognizerResponse,
    RegisterLicensePlateRequest,
)
from backend.models import AccessRestrictions
from backend.router_utils import get_camera_response_from_mac_address_or_fail
from backend.s3_utils import RequestTime, get_signed_url
from backend.task_worker.background_task import send_license_plate_alerts
from backend.value_store import ValueStore
from backend.value_store.value_store import get_license_plate_of_interest_alert_key

logger = logging.getLogger(logging_config.LOGGER_NAME)


async def recognise_license_plate(
    image_s3_path: str, secrets: BackendSecrets, region_name: str
) -> PlateRecognizerResponse:
    signed_image_s3_path = get_signed_url(
        s3_path=image_s3_path,
        request_time=RequestTime.from_datetime(datetime.datetime.utcnow()),
        aws_credentials=secrets.aws_credentials(),
        aws_region=region_name,
    )

    sentry_sdk.set_context(
        "LPR API request",
        {"image_s3_path": image_s3_path, "signed_image_s3_path": signed_image_s3_path},
    )

    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(
                "https://api.platerecognizer.com/v1/plate-reader",
                headers={"Authorization": "Token " + str(secrets.lpr_api_token)},
                data={"upload_url": signed_image_s3_path},
            ) as response:
                json = await response.json()
        except aiohttp.ClientError as e:
            raise LicensePlateDetectionError(
                f"Error while calling plate recognition API: {e}"
            )

    sentry_sdk.set_context("LPR API response", json)

    try:
        plate_recognizer_response = parse_obj_as(PlateRecognizerResponse, json)
    except ValidationError as e:
        raise LicensePlateDetectionError(
            f"Error while parsing plate recognition API response: {e}"
        )

    return plate_recognizer_response


async def is_license_plate_request_from_nvr(
    session: TenantAwareAsyncSession,
    register_plate_request: RegisterLicensePlateRequest,
    nvr_uuid: str,
) -> bool:
    allowed_mac_addresses = await orm.NVR.get_allowed_mac_addresses(
        session, nvr_uuid, [register_plate_request.mac_address]
    )
    return len(allowed_mac_addresses) == 1


async def get_license_plates_of_interest(session: TenantAwareAsyncSession) -> set[str]:
    profiles = await orm.LicensePlateAlertProfile.get_profiles(session)
    return {profile.license_plate_number for profile in profiles}


async def send_license_plate_alerts_if_needed(
    db: database.Database,
    license_plate_occurrence: models.LicensePlateEvent,
    value_store: ValueStore,
) -> None:
    async with db.tenant_session() as session:
        camera = await get_camera_response_from_mac_address_or_fail(
            session, AccessRestrictions(), license_plate_occurrence.mac_address
        )

        alert_profiles = await orm.LicensePlateAlertProfile.get_profiles(
            session=session,
            license_plate_numbers={license_plate_occurrence.license_plate_number},
        )

        license_plate_alerts_to_send = LicensePlateAlertsSendRequest(
            alert_occurrences=[], tenant=session.tenant
        )
        for alert_profile in alert_profiles:
            # Skip sending alert if the alert profile has been alerted recently
            if await value_store.get_timestamp(
                key=get_license_plate_of_interest_alert_key(
                    alert_profile_id=alert_profile.id
                )
            ):
                continue

            license_plate_alerts_to_send.alert_occurrences.append(
                LicensePlateAlertOccurrence(
                    detection=license_plate_occurrence,
                    alert_profile=alert_profile,
                    location_name=camera.location,
                    group_name=camera.group_name,
                    camera_name=camera.camera.name,
                )
            )
    # Skip sending alert if there are no alerts to send
    if len(license_plate_alerts_to_send.alert_occurrences) == 0:
        return

    logger.info(
        f"Received {len(license_plate_alerts_to_send.alert_occurrences)} license plates"
        " to be alerted"
    )

    # Send the alert through celery to avoid blocking the request
    send_license_plate_alerts.delay(jsonable_encoder(license_plate_alerts_to_send))
