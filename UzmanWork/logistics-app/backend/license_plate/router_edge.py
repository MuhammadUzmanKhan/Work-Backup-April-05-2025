import logging

import fastapi
import sentry_sdk
from fastapi import APIRouter, Depends

from backend import auth, auth_models, logging_config
from backend.database import database, models, orm
from backend.dependencies import (
    get_aws_region,
    get_backend_database,
    get_backend_secrets,
    get_value_store,
)
from backend.envs import BackendSecrets
from backend.license_plate.models import (
    LicensePlateDetectionError,
    RegisterLicensePlateRequest,
)
from backend.license_plate.utils import (
    is_license_plate_request_from_nvr,
    recognise_license_plate,
    send_license_plate_alerts_if_needed,
)
from backend.models import EventsIngestionResponse
from backend.value_store.value_store import ValueStore

logger = logging.getLogger(logging_config.LOGGER_NAME)

license_plate_router_edge = APIRouter(
    prefix="/license_plate",
    tags=["license_plate"],
    generate_unique_id_function=lambda route: route.name,
)

VALID_LICENSE_PLATE_LENGTHS = [6, 7]


@license_plate_router_edge.post("/register_image")
async def register_license_plate_image(
    request: RegisterLicensePlateRequest,
    db: database.Database = Depends(get_backend_database),
    secrets: BackendSecrets = Depends(get_backend_secrets),
    aws_region: str = Depends(get_aws_region),
    edge_user: auth_models.EdgeUser = Depends(auth.edge_user_role_guard),
    value_store: ValueStore = Depends(get_value_store),
) -> EventsIngestionResponse:
    nvr_uuid = edge_user.user_uuid
    sentry_sdk.set_user({"id": nvr_uuid})
    sentry_sdk.set_tag("lpr_timestamp", request.timestamp.isoformat())
    sentry_sdk.set_tag("lpr_image_s3_path", request.image_s3_path)
    sentry_sdk.set_tag("lpr_camera_mac", request.mac_address)
    sentry_sdk.set_tag("lpr_track_id", request.track_id)
    sentry_sdk.set_tag(
        "lpr_perception_stack_start_id", request.perception_stack_start_id
    )

    async with db.tenant_session() as session:
        if not await is_license_plate_request_from_nvr(session, request, nvr_uuid):
            logger.error(
                "Received license plate with mac addresses that don't belong to"
                f" the NVR {nvr_uuid}. Received:"
                f" {request=}"
            )
            return EventsIngestionResponse(num_events_received=1, num_events_ingested=0)

    try:
        response = await recognise_license_plate(
            image_s3_path=request.image_s3_path, secrets=secrets, region_name=aws_region
        )
    except LicensePlateDetectionError as e:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Error while calling plate recognition API: {e}",
        )

    # check if the detected license plate is valid by checking its length
    is_license_plate_valid = (
        response.results
        and len(response.results[0].plate) in VALID_LICENSE_PLATE_LENGTHS
    )
    if not is_license_plate_valid:
        return EventsIngestionResponse(num_events_received=1, num_events_ingested=0)

    result = response.results[0]
    detected_license_plate_number = result.plate.upper()

    sentry_sdk.set_tag("lpr_detected_plate", detected_license_plate_number)
    sentry_sdk.set_tag("lpr_score", "{:.3f}".format(result.score))
    sentry_sdk.set_tag("lpr_dcore", "{:.3f}".format(result.dscore))
    sentry_sdk.set_tag("lpr_vscore", "{:.3f}".format(result.vehicle.score))

    # add result to the database
    async with db.tenant_session() as session:
        license_plate = await orm.LicensePlate.system_get_or_create(
            session=session,
            license_plate_metadata=models.LicensePlate(
                license_plate_number=detected_license_plate_number
            ),
        )
        license_plate_detection = models.LicensePlateDetectionCreate(
            time=request.timestamp,
            license_plate_number=license_plate.license_plate_number,
            score=result.score,
            dscore=result.dscore,
            vscore=result.vehicle.score,
            mac_address=request.mac_address,
            perception_stack_start_id=request.perception_stack_start_id,
            object_id=request.object_id,
            track_id=request.track_id,
            image_s3_path=request.image_s3_path,
            x_min=result.box.xmin,
            y_min=result.box.ymin,
            x_max=result.box.xmax,
            y_max=result.box.ymax,
        )
        await orm.LicensePlateDetection.add_detection(
            session=session, detection_metadata=license_plate_detection
        )

        await send_license_plate_alerts_if_needed(
            db=db,
            license_plate_occurrence=models.LicensePlateEvent(
                license_plate_number=license_plate.license_plate_number,
                time=request.timestamp,
                mac_address=request.mac_address,
            ),
            value_store=value_store,
        )

    return EventsIngestionResponse(num_events_received=1, num_events_ingested=1)
