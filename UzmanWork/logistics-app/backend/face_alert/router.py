import datetime
import functools
import logging

import fastapi
from fastapi import APIRouter, Body, Depends, HTTPException
from pydantic import EmailStr

from backend import auth, auth_models, logging_config
from backend.access_logs.constants import UserActions
from backend.access_logs.utils import AccessLogger
from backend.database import database, models, orm
from backend.database.face_models import UniqueFaceOccurrence
from backend.database.models import FaceAlertProfile
from backend.database.orm.orm_face_alert_profile import FaceAlertProfileError
from backend.dependencies import (
    get_aws_region,
    get_backend_database,
    get_backend_secrets,
)
from backend.envs import BackendSecrets
from backend.face.models import FaceOccurrenceResponse
from backend.face_alert.models import (
    FaceAlertProfileRequest,
    FaceAlertProfileResponse,
    FaceAlertResponse,
    FaceAlertsDiscoveryRequest,
    OptionalFaceAlertProfileResponse,
    RegisterFaceAlertProfileRequest,
    UpdateNotificationGroupsRequest,
)
from backend.face_alert.router_utils import (
    get_one_alert_profile_or_fail,
    get_optional_signed_url,
    set_from_profile_identifier,
)
from backend.fastapi_utils import WithResponseExcludeNone
from backend.models import AccessRestrictions
from backend.router_utils import check_camera_access
from backend.s3_utils import RequestTime, get_signed_url
from backend.utils import AwareDatetime

logger = logging.getLogger(logging_config.LOGGER_NAME)

# Router the frontend uses
face_alert_router = WithResponseExcludeNone(
    APIRouter(
        prefix="/face_alert",
        tags=["face_alert"],
        generate_unique_id_function=lambda route: route.name,
    )
)


@face_alert_router.post("/latest_person_of_interest_alert_occurrences")
async def get_latest_person_of_interest_alert_occurrences(
    alerts_request: FaceAlertsDiscoveryRequest,
    _app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    aws_region: str = Depends(get_aws_region),
    secrets: BackendSecrets = Depends(get_backend_secrets),
    _access_logger: AccessLogger = Depends(
        AccessLogger(
            UserActions.VIEWED_PERSON_OF_INTEREST_OCCURRENCES,
            ["mac_address", "start_time", "end_time"],
        )
    ),
) -> list[FaceAlertResponse]:
    """Get latest face alerts from the database for all alert profiles which are person
    of interest and the user has access to. The returned alerts are filtered by
    the start time, end time, mac addresses, and location ids.
    """
    async with db.tenant_session() as session:
        await check_camera_access(
            session=session,
            access=access,
            mac_addresses=list(alerts_request.mac_addresses),
        )
        alert_profiles: list[models.FaceAlertProfile] = (
            await orm.FaceAlertProfile.get_profiles(
                session=session, include_person_of_interest_only=True
            )
        )
        alert_profile_mapping = {
            alert_profile.org_unique_face.id: alert_profile
            for alert_profile in alert_profiles
        }
        alerts = await orm.OrganizationUniqueFace.get_latest_unique_face_occurrences(
            session=session,
            start_time=alerts_request.start_time,
            end_time=alerts_request.end_time,
            location_ids=alerts_request.location_ids,
            mac_addresses=alerts_request.mac_addresses,
            org_unique_face_ids=set(alert_profile_mapping.keys()),
        )

        request_time = RequestTime.from_datetime(datetime.datetime.utcnow())
        get_signed_url_partial = functools.partial(
            get_signed_url,
            request_time=request_time,
            aws_credentials=secrets.aws_credentials(),
            aws_region=aws_region,
        )

        # Populate alert response: for each alert, request a signed url from S3 so that
        # the frontend can download the image without needing to be authenticated with
        # S3.
        responses = []
        for alert in alerts:
            alert_profile = alert_profile_mapping.get(alert.org_unique_face_id)
            if alert_profile is None:
                raise HTTPException(
                    status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                    detail=f"{alert.org_unique_face_id=} not found",
                )

            responses.append(
                FaceAlertResponse(
                    unique_face_occurrence=UniqueFaceOccurrence(**alert.dict()),
                    face_profile_id=alert_profile.id,
                    description=alert_profile.description,
                    notification_groups=alert_profile.notification_groups,
                    face_profile_s3_signed_url=get_signed_url_partial(
                        s3_path=alert_profile.org_unique_face.s3_path
                    ),
                )
            )
    return responses


@face_alert_router.post("/alert_occurrences/{alert_profile_id}")
async def get_alert_occurrences(
    alert_profile_id: int,
    alerts_request: FaceAlertsDiscoveryRequest,
    app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    aws_region: str = Depends(get_aws_region),
    secrets: BackendSecrets = Depends(get_backend_secrets),
    _access_logger: AccessLogger = Depends(
        AccessLogger(
            UserActions.VIEWED_ALERT_OCCURRENCES,
            ["alert_profile_id", "start_time", "end_time"],
        )
    ),
) -> list[FaceOccurrenceResponse]:
    """Get face alert occurrences from the database for a specified alert profile id.
    The returned alerts are filtered by the start time, end time, mac addresses,
    and location ids.
    """
    async with db.tenant_session() as session:
        await check_camera_access(
            session=session,
            access=access,
            mac_addresses=list(alerts_request.mac_addresses),
        )
        alert_profiles = await orm.FaceAlertProfile.get_profiles(
            session=session,
            profile_ids={
                models.FaceAlertProfileIdentifier(alert_profile_id=alert_profile_id)
            },
        )

    alert_profile = get_one_alert_profile_or_fail(alert_profiles)

    async with db.tenant_session() as session:
        alert_occurrences = await orm.FaceOccurrence.get_face_occurrences(
            session=session,
            start_time=alerts_request.start_time,
            end_time=alerts_request.end_time,
            org_unique_face_ids={alert_profile.org_unique_face.id},
            location_ids=alerts_request.location_ids,
            mac_addresses=alerts_request.mac_addresses,
        )

    get_optional_signed_url_partial = functools.partial(
        get_optional_signed_url,
        request_time=RequestTime.from_datetime(AwareDatetime.utcnow()),
        secrets=secrets,
        region_name=aws_region,
    )
    # Populate alert response: for each alert, request a signed url from S3 so that
    # the frontend can download the image without needing to be authenticated with
    # S3.
    responses = []
    for alert in alert_occurrences:
        responses.append(
            FaceOccurrenceResponse(
                **alert.dict(),
                person_s3_signed_url=get_optional_signed_url_partial(
                    s3_path=alert.person_s3_path
                ),
            )
        )
    return responses


@face_alert_router.get("/alert_profiles")
async def get_alert_profiles(
    _app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    aws_region: str = Depends(get_aws_region),
    secrets: BackendSecrets = Depends(get_backend_secrets),
) -> list[FaceAlertProfileResponse]:
    async with db.tenant_session() as session:
        alert_profiles = await orm.FaceAlertProfile.get_profiles(session)

    response = []
    request_time = RequestTime.from_datetime(datetime.datetime.utcnow())

    async with db.tenant_session():
        for alert_profile in alert_profiles:
            s3_signed_url = get_optional_signed_url(
                s3_path=alert_profile.org_unique_face.s3_path,
                request_time=request_time,
                secrets=secrets,
                region_name=aws_region,
            )
            response.append(
                FaceAlertProfileResponse(
                    alert_profile=FaceAlertProfile(**alert_profile.dict()),
                    s3_signed_url=s3_signed_url,
                )
            )
    return response


@face_alert_router.post("/update_notification_groups/{alert_profile_id}")
async def update_notification_groups(
    alert_profile_id: int,
    update_request: UpdateNotificationGroupsRequest,
    _app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    _access_logger: AccessLogger = Depends(
        AccessLogger(
            UserActions.UPDATED_FACE_NOTIFICATION_GROUP,
            ["alert_profile_id", "notification_group_ids"],
        )
    ),
) -> None:
    async with db.tenant_session() as session:
        try:
            await orm.FaceAlertProfile.update_notification_groups(
                session=session,
                alert_profile_id=alert_profile_id,
                notification_group_ids=update_request.notification_group_ids,
            )
        except FaceAlertProfileError as ex:
            raise HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST, detail=str(ex)
            )


@face_alert_router.post("/alert_profile")
async def get_alert_profile(
    alert_profile_request: FaceAlertProfileRequest,
    _app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    aws_region: str = Depends(get_aws_region),
    secrets: BackendSecrets = Depends(get_backend_secrets),
    _access_logger: AccessLogger = Depends(
        AccessLogger(UserActions.VIEWED_ALERT_PROFILE)
    ),
) -> OptionalFaceAlertProfileResponse:
    async with db.tenant_session() as session:
        alert_profiles = await orm.FaceAlertProfile.get_profiles(
            session=session,
            profile_ids=set_from_profile_identifier(
                alert_profile_request.profile_identifier
            ),
        )

    if len(alert_profiles) == 0:
        return OptionalFaceAlertProfileResponse()

    alert_profile = get_one_alert_profile_or_fail(alert_profiles)

    request_time = RequestTime.from_datetime(datetime.datetime.utcnow())
    s3_signed_url = get_optional_signed_url(
        s3_path=alert_profile.org_unique_face.s3_path,
        request_time=request_time,
        secrets=secrets,
        region_name=aws_region,
    )
    return OptionalFaceAlertProfileResponse(
        alert_profile_response=FaceAlertProfileResponse(
            alert_profile=FaceAlertProfile(**alert_profile.dict()),
            s3_signed_url=s3_signed_url,
        )
    )


@face_alert_router.post("/register_alert_profile")
async def register_alert_profile(
    request: RegisterFaceAlertProfileRequest,
    app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
    _access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    db: database.Database = Depends(get_backend_database),
    _access_logger: AccessLogger = Depends(
        AccessLogger(
            UserActions.REGISTERED_ALERT_PROFILE,
            ["description", "is_person_of_interest", "org_unique_face_id"],
        )
    ),
) -> int:
    async with db.tenant_session() as session:
        try:
            alert_profile_id = await orm.FaceAlertProfile.new_profile(
                session=session,
                face_alert_profile=models.FaceAlertProfileCreate(
                    description=request.description,
                    is_person_of_interest=request.is_person_of_interest,
                    org_unique_face_id=request.org_unique_face_id,
                    owner_user_email=EmailStr(app_user.user_email),
                    creation_time=AwareDatetime.utcnow(),
                ),
            )
        except FaceAlertProfileError as ex:
            raise HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST, detail=str(ex)
            )
    return alert_profile_id


@face_alert_router.post("/update_profile_description/{alert_profile_id}")
async def update_profile_description(
    alert_profile_id: int,
    description: str = Body(embed=True),
    _app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    _access_logger: AccessLogger = Depends(
        AccessLogger(
            UserActions.UPDATED_FACE_PROFILE_DESCRIPTION,
            ["alert_profile_id", "description"],
        )
    ),
) -> None:
    async with db.tenant_session() as session:
        try:
            await orm.FaceAlertProfile.update_description(
                session=session,
                description=description,
                alert_profile_id=alert_profile_id,
            )
        except FaceAlertProfileError as ex:
            raise HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST, detail=str(ex)
            )


@face_alert_router.post("/update_person_of_interest_flag/{alert_profile_id}")
async def update_person_of_interest_flag(
    alert_profile_id: int,
    is_person_of_interest: bool = Body(embed=True),
    _app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    _access_logger: AccessLogger = Depends(
        AccessLogger(
            UserActions.UPDATED_IS_PERSON_OF_INTEREST,
            ["alert_profile_id", "is_person_of_interest"],
        )
    ),
) -> None:
    async with db.tenant_session() as session:
        try:
            await orm.FaceAlertProfile.update_person_of_interest_flag(
                session=session,
                is_person_of_interest=is_person_of_interest,
                alert_profile_id=alert_profile_id,
            )
        except FaceAlertProfileError as ex:
            raise HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST, detail=str(ex)
            )


@face_alert_router.delete("/delete_alert_profile/{alert_profile_id}")
async def delete_alert_profile(
    alert_profile_id: int,
    _app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    _access_logger: AccessLogger = Depends(
        AccessLogger(UserActions.DELETED_ALERT_PROFILE, ["alert_profile_id"])
    ),
) -> None:
    async with db.tenant_session() as session:
        try:
            await orm.FaceAlertProfile.delete_profile(
                session=session, alert_profile_id=alert_profile_id
            )
        except FaceAlertProfileError as ex:
            raise HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST, detail=str(ex)
            )
