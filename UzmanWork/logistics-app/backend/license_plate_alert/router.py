import logging

import fastapi
from fastapi import APIRouter, Depends, HTTPException
from pydantic import EmailStr

from backend import auth, auth_models, logging_config
from backend.access_logs.constants import UserActions
from backend.access_logs.utils import AccessLogger
from backend.boto_utils import BotoSessionFn
from backend.database import database, models, orm
from backend.database.orm.orm_license_plate import LicensePlateOccurrenceError
from backend.database.orm.orm_license_plate_alert_profile import (
    LicensePlateAlertProfileError,
)
from backend.dependencies import get_backend_database, get_boto_session_maker
from backend.fastapi_utils import WithResponseExcludeNone
from backend.license_plate_alert.models import (
    RegisterLicencePlateAlertProfileRequest,
    UpdateNotificationGroupsRequest,
)
from backend.license_plate_alert.utils import (
    LicensePlateImageCopyError,
    LicensePlateImageDeleteError,
    copy_s3_path_for_plate_alert,
    delete_plate_alert_s3_image,
)
from backend.utils import AwareDatetime

logger = logging.getLogger(logging_config.LOGGER_NAME)


# Router the frontend uses
license_plate_alert_router = WithResponseExcludeNone(
    APIRouter(
        prefix="/license_plate_alert",
        tags=["license_plate_alert"],
        generate_unique_id_function=lambda route: route.name,
    )
)


@license_plate_alert_router.post("/add_alert_profile")
async def add_alert_profile(
    request: RegisterLicencePlateAlertProfileRequest,
    app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
    boto_session_maker: BotoSessionFn = Depends(get_boto_session_maker),
    db: database.Database = Depends(get_backend_database),
    _access_logger: AccessLogger = Depends(
        AccessLogger(
            UserActions.CREATE_LICENSE_PLATE_ALERT_PROFILE, ["license_plate_number"]
        )
    ),
) -> int:
    try:
        # get the last occurrence of the license plate number
        # and copy the S3 image in it
        async with db.tenant_session() as session:
            last_occurrence = (
                await orm.LicensePlateDetection.get_last_occurrence_image_data(
                    session=session, license_plate_number=request.license_plate_number
                )
            )
        alert_s3_path = await copy_s3_path_for_plate_alert(
            boto_session_maker, last_occurrence.image_s3_path, app_user.tenant
        )
    except (LicensePlateOccurrenceError, LicensePlateImageCopyError) as ex:
        raise HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=f"failed pre-alert-generation task: {str(ex)}",
        )

    async with db.tenant_session() as session:
        try:
            alert_profile_id = await orm.LicensePlateAlertProfile.add_profile(
                session=session,
                alert_profile_create=models.LicensePlateAlertProfileCreate(
                    license_plate_number=request.license_plate_number,
                    owner_user_email=EmailStr(app_user.user_email),
                    creation_time=AwareDatetime.utcnow(),
                    image_s3_path=alert_s3_path,
                    x_min=last_occurrence.x_min,
                    y_min=last_occurrence.y_min,
                    x_max=last_occurrence.x_max,
                    y_max=last_occurrence.y_max,
                ),
            )
        except LicensePlateAlertProfileError as ex:
            raise HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST, detail=str(ex)
            )
    return alert_profile_id


@license_plate_alert_router.delete("/delete_alert_profile/{alert_profile_id}")
async def delete_alert_profile(
    alert_profile_id: int,
    _app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    boto_session_maker: BotoSessionFn = Depends(get_boto_session_maker),
    _access_logger: None = Depends(
        AccessLogger(
            UserActions.DELETE_LICENSE_PLATE_ALERT_PROFILE, ["license_plate_number"]
        )
    ),
) -> None:
    try:
        async with db.tenant_session() as session:
            s3_path = await orm.LicensePlateAlertProfile.get_profile_s3_path(
                session, alert_profile_id
            )
        await delete_plate_alert_s3_image(boto_session_maker, s3_path)
    except (LicensePlateAlertProfileError, LicensePlateImageDeleteError) as ex:
        raise HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=f"failed pre-alert-deletion task: {str(ex)}",
        )

    async with db.tenant_session() as session:
        try:
            await orm.LicensePlateAlertProfile.delete_profile(
                session=session, alert_profile_id=alert_profile_id
            )

        except LicensePlateAlertProfileError as ex:
            raise HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST, detail=str(ex)
            )


@license_plate_alert_router.get("/profile_exists/{license_plate_number}")
async def profile_exists(
    license_plate_number: str,
    _app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
    db: database.Database = Depends(get_backend_database),
) -> bool:
    async with db.tenant_session() as session:
        profiles = await orm.LicensePlateAlertProfile.get_profiles(
            session=session, license_plate_numbers={license_plate_number}
        )
    if len(profiles) > 1:
        raise HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=(
                "Multiple profiles found for license plate number"
                f" {license_plate_number}"
            ),
        )
    return len(profiles) == 1


@license_plate_alert_router.post("/update_notification_groups/{alert_profile_id}")
async def update_notification_groups(
    alert_profile_id: int,
    update_request: UpdateNotificationGroupsRequest,
    _app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    _access_logger: AccessLogger = Depends(
        AccessLogger(
            UserActions.UPDATED_LICENSE_PLATE_NOTIFICATION_GROUPS,
            ["alert_profile_id", "notification_group_ids"],
        )
    ),
) -> None:
    async with db.tenant_session() as session:
        try:
            await orm.LicensePlateAlertProfile.update_notification_groups(
                session=session,
                alert_profile_id=alert_profile_id,
                notification_group_ids=update_request.notification_group_ids,
            )
        except LicensePlateAlertProfileError as ex:
            raise HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST, detail=str(ex)
            )
