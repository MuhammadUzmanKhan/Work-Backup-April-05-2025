import datetime
import functools
import logging

import fastapi
from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile
from pydantic import EmailStr

from backend import auth, auth_models, logging_config
from backend.access_logs.constants import UserActions
from backend.access_logs.utils import AccessLogger
from backend.boto_utils import BotoSessionFn
from backend.database import database, orm
from backend.database.models import MctImage
from backend.dependencies import (
    get_aws_region,
    get_backend_database,
    get_backend_envs,
    get_backend_secrets,
    get_boto_session_maker,
    get_slack_client,
)
from backend.envs import BackendEnvs, BackendSecrets
from backend.face.face_upload_utils import (
    FaceUploadError,
    generate_uploaded_face_identifier,
    register_uploaded_face,
    upload_face_to_s3,
)
from backend.face.models import (
    FaceOccurrenceRequest,
    FaceOccurrenceResponse,
    FaceOccurrencesRequest,
    FaceUploadProcessData,
    UniqueFaceResponse,
    UniqueFacesRequest,
)
from backend.face.utils import check_face_image
from backend.face_alert.router_utils import get_optional_signed_url
from backend.fastapi_utils import WithResponseExcludeNone
from backend.models import AccessRestrictions
from backend.multi_cam_tracking.models import TrackThumbnailResponse
from backend.multi_cam_tracking.router_utils import query_track_by_object_info_and_check
from backend.router_utils import check_camera_access
from backend.s3_utils import RequestTime, get_signed_url
from backend.slack_client import SlackClient
from backend.task_worker.background_task import (
    ensure_uploaded_face_has_been_processed_task,
)

logger = logging.getLogger(logging_config.LOGGER_NAME)


# Router the frontend uses
face_router = WithResponseExcludeNone(
    APIRouter(
        prefix="/face",
        tags=["face"],
        generate_unique_id_function=lambda route: route.name,
    )
)


@face_router.post("/unique_faces")
async def unique_faces(
    unique_faces_request: UniqueFacesRequest,
    aws_region: str = Depends(get_aws_region),
    secrets: BackendSecrets = Depends(get_backend_secrets),
    _app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
) -> list[UniqueFaceResponse]:
    async with db.tenant_session(
        session_type=database.SessionType.MODERATELY_SLOW_QUERY
    ) as session:
        await check_camera_access(
            session=session,
            access=access,
            mac_addresses=list(unique_faces_request.mac_addresses),
        )

        unique_faces = (
            await orm.OrganizationUniqueFace.get_latest_unique_face_occurrences(
                session,
                start_time=unique_faces_request.start_time,
                end_time=unique_faces_request.end_time,
                location_ids=unique_faces_request.location_ids,
                mac_addresses=unique_faces_request.mac_addresses,
            )
        )

    # Populate unique faces response: for each unique face, request a signed url
    # from S3 so that the frontend can download the image without needing
    # to be authenticated with S3.
    response = []
    request_time = RequestTime.from_datetime(datetime.datetime.utcnow())
    for unique_face in unique_faces:
        s3_signed_url = get_signed_url(
            s3_path=unique_face.s3_path,
            request_time=request_time,
            aws_credentials=secrets.aws_credentials(),
            aws_region=aws_region,
        )
        response.append(
            UniqueFaceResponse(**unique_face.dict(), s3_signed_url=s3_signed_url)
        )

    return response


@face_router.post("/face_occurrences")
async def face_occurrences(
    face_occurrences_request: FaceOccurrencesRequest,
    app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    aws_region: str = Depends(get_aws_region),
    secrets: BackendSecrets = Depends(get_backend_secrets),
    _access_logger: AccessLogger = Depends(
        AccessLogger(
            UserActions.VIEWED_FACE_OCCURRENCES,
            ["start_time", "end_time", "org_unique_face_id"],
        )
    ),
) -> list[FaceOccurrenceResponse]:
    async with db.tenant_session(
        session_type=database.SessionType.MODERATELY_SLOW_QUERY
    ) as session:
        await check_camera_access(
            session=session,
            access=access,
            mac_addresses=list(face_occurrences_request.mac_addresses),
        )
        face_occurrences = await orm.FaceOccurrence.get_face_occurrences(
            session,
            start_time=face_occurrences_request.start_time,
            end_time=face_occurrences_request.end_time,
            org_unique_face_ids={face_occurrences_request.org_unique_face_id},
            location_ids=face_occurrences_request.location_ids,
            mac_addresses=face_occurrences_request.mac_addresses,
        )

    request_time = RequestTime.from_datetime(datetime.datetime.utcnow())

    get_optional_signed_url_partial = functools.partial(
        get_optional_signed_url,
        request_time=request_time,
        secrets=secrets,
        region_name=aws_region,
    )

    # Populate face occurrence response: for each face, request a signed url
    # from S3 so that the frontend can download the image without needing
    # to be authenticated with S3.
    fo_responses = []
    for fo in face_occurrences:
        fo_responses.append(
            FaceOccurrenceResponse(
                **fo.dict(),
                person_s3_signed_url=get_optional_signed_url_partial(
                    s3_path=fo.person_s3_path
                ),
            )
        )

    return fo_responses


@face_router.post("/track_thumbnail_from_face_occurrence")
async def track_thumbnail_from_face_occurrence(
    face_occurrence_request: FaceOccurrenceRequest,
    app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    aws_region: str = Depends(get_aws_region),
    secrets: BackendSecrets = Depends(get_backend_secrets),
    slack_client: SlackClient = Depends(get_slack_client),
) -> TrackThumbnailResponse:
    async with db.tenant_session() as session:
        fo = await orm.FaceOccurrence.get_face_occurrence_or_none(
            session=session, face_occurrence_id=face_occurrence_request.id
        )

    if fo is None:
        raise HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=f"Face occurrence {face_occurrence_request.id} not found",
        )

    await check_camera_access(session, access, [fo.camera_mac_address])

    if fo.pcp_idx_in_frame is None:
        raise HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Face occurrence {face_occurrence_request.id} has no associated track"
            ),
        )

    if fo.person_s3_path is None:
        raise HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Face occurrence {face_occurrence_request.id} "
                "has no associated person image"
            ),
        )

    async with db.tenant_session() as session:
        track = await query_track_by_object_info_and_check(
            session=session,
            slack_client=slack_client,
            mac_address=fo.camera_mac_address,
            timestamp=fo.occurrence_time,
            object_idx=fo.pcp_idx_in_frame,
        )

    logging.info(
        f"[FaceOccurrence to Journey] Found track {track.track_id} in "
        f"camera {fo.camera_mac_address} at {fo.occurrence_time.isoformat()} "
        f"for face occurrence id={fo.id}, pcp_idx_in_frame={fo.pcp_idx_in_frame}"
    )

    # Create MctImages from track and sign thumbnails
    mct_image = MctImage(
        camera_mac_address=fo.camera_mac_address,
        timestamp=fo.occurrence_time,
        s3_path=fo.person_s3_path,
        track_id=track.track_id,
        perception_stack_start_id=track.perception_stack_start_id,
    )
    request_time = RequestTime.from_datetime(datetime.datetime.utcnow())
    return TrackThumbnailResponse(
        thumbnail_data=mct_image,
        signed_url=(
            get_signed_url(
                s3_path=mct_image.s3_path,
                request_time=request_time,
                aws_credentials=secrets.aws_credentials(),
                aws_region=aws_region,
            )
        ),
    )


@face_router.post("/upload_face_picture")
async def upload_face_picture(
    file: UploadFile,
    profile_name: str = Form(),
    boto_session_maker: BotoSessionFn = Depends(get_boto_session_maker),
    # TODO(@lberg): ensure regular is the correct role
    app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    envs: BackendEnvs = Depends(get_backend_envs),
    _access_logger: AccessLogger = Depends(
        AccessLogger(UserActions.UPLOADED_FACE_PICTURE, ["profile_name"])
    ),
) -> None:
    await check_face_image(file)
    try:
        face_s3_path = await upload_face_to_s3(
            boto_session_maker,
            file,
            generate_uploaded_face_identifier(),
            app_user.tenant,
            envs.environment_name,
        )
        org_unique_face_id = await register_uploaded_face(
            db, profile_name, face_s3_path, EmailStr(app_user.user_email)
        )
    except FaceUploadError as ex:
        logger.error(f"Failed to register uploaded face: {ex}")
        raise HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to register uploaded face: {ex}",
        )

    ensure_uploaded_face_has_been_processed_task.delay(
        FaceUploadProcessData(
            tenant=app_user.tenant,
            access_restrictions=access,
            org_unique_face_id=org_unique_face_id,
            face_s3_path=face_s3_path,
        ).json()
    )
