import datetime
import logging

from fastapi import APIRouter, Depends

from backend import auth, auth_models, logging_config
from backend.database import database, orm
from backend.dependencies import (
    get_aws_region,
    get_backend_database,
    get_backend_secrets,
)
from backend.envs import BackendSecrets
from backend.fastapi_utils import WithResponseExcludeNone
from backend.license_plate.models import (
    LicensePlateOccurrencesRequest,
    LicensePlateOccurrencesResponse,
    LicensePlateResponse,
    LicensePlatesRequest,
)
from backend.license_plate.utils import get_license_plates_of_interest
from backend.models import AccessRestrictions
from backend.router_utils import check_camera_access
from backend.s3_utils import RequestTime, get_signed_url

logger = logging.getLogger(logging_config.LOGGER_NAME)

license_plate_router = WithResponseExcludeNone(
    APIRouter(
        prefix="/license_plate",
        tags=["license_plate"],
        generate_unique_id_function=lambda route: route.name,
    )
)


@license_plate_router.post("/license_plates")
async def license_plates(
    request: LicensePlatesRequest,
    aws_region: str = Depends(get_aws_region),
    secrets: BackendSecrets = Depends(get_backend_secrets),
    _app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
) -> list[LicensePlateResponse]:
    async with db.tenant_session() as session:
        await check_camera_access(
            session=session, access=access, mac_addresses=list(request.mac_addresses)
        )

        mac_addresses = (
            await orm.Camera.get_mac_addresses_with_license_plate_detection_enabled(
                session=session,
                mac_addresses=request.mac_addresses,
                location_ids=request.location_ids,
            )
        )

        license_plates_of_interest = (
            await get_license_plates_of_interest(session)
            if request.include_license_plates_of_interest_only
            else None
        )

    async with db.tenant_session() as session:
        license_plate_tracks_info = await orm.LicensePlateDetection.get_track_info(
            session=session,
            start_time=request.start_time,
            end_time=request.end_time,
            mac_addresses=set(mac_addresses),
            license_plate_numbers=license_plates_of_interest,
        )
    responses = []
    request_time = RequestTime.from_datetime(datetime.datetime.utcnow())
    for license_plate in license_plate_tracks_info:
        s3_signed_url = get_signed_url(
            s3_path=license_plate.image_s3_path,
            request_time=request_time,
            aws_credentials=secrets.aws_credentials(),
            aws_region=aws_region,
        )

        responses.append(
            LicensePlateResponse(
                license_plate=license_plate, s3_signed_url=s3_signed_url
            )
        )
    return responses


@license_plate_router.post("/license_plate_occurrences")
async def retrieve_license_plate_occurrences(
    request: LicensePlateOccurrencesRequest,
    _app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
) -> list[LicensePlateOccurrencesResponse]:
    async with db.tenant_session() as session:
        await check_camera_access(
            session=session, access=access, mac_addresses=list(request.mac_addresses)
        )

        mac_addresses = (
            await orm.Camera.get_mac_addresses_with_license_plate_detection_enabled(
                session=session,
                mac_addresses=request.mac_addresses,
                location_ids=request.location_ids,
            )
        )

    async with db.tenant_session() as session:
        license_plate_occurrences = await orm.LicensePlateDetection.get_occurrences(
            session=session,
            start_time=request.start_time,
            end_time=request.end_time,
            mac_addresses=set(mac_addresses),
            license_plate_number=request.license_plate_number,
        )

    lp_responses = []
    for license_plate in license_plate_occurrences:
        lp_responses.append(
            LicensePlateOccurrencesResponse(license_plate=license_plate)
        )
    return lp_responses
