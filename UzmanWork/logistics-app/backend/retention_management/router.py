import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import EmailStr

from backend import auth, auth_models, logging_config
from backend.fastapi_utils import WithResponseExcludeNone
from backend.members.utils import is_coram_employee_email
from backend.task_worker.periodic_task import (
    periodic_enforce_face_occurrences_retention,
    periodic_enforce_mct_images_retention,
    periodic_enforce_perception_events_retention,
    periodic_enforce_thumbnails_retention,
)

retention_management_router = WithResponseExcludeNone(
    APIRouter(
        prefix="/retention_management",
        tags=["retention_management"],
        generate_unique_id_function=lambda route: route.name,
    )
)

logger = logging.getLogger(logging_config.LOGGER_NAME)


# TODO(@lberg): remove once the periodic task is working
@retention_management_router.get("/enforce_retention_thumbnails")
async def enforce_retention_thumbnails(
    _app_user: auth_models.AppUser = Depends(auth.admin_user_role_guard),
) -> None:
    if not is_coram_employee_email(EmailStr(_app_user.user_email)):
        raise HTTPException(
            status_code=403, detail="Unauthorized to enforce thumbnails retention."
        )
    periodic_enforce_thumbnails_retention.delay()


# TODO(@lberg): remove once the periodic task is working
@retention_management_router.get("/enforce_retention_mct_images")
async def enforce_retention_mct_images(
    _app_user: auth_models.AppUser = Depends(auth.admin_user_role_guard),
) -> None:
    if not is_coram_employee_email(EmailStr(_app_user.user_email)):
        raise HTTPException(
            status_code=403, detail="Unauthorized to enforce thumbnails retention."
        )
    periodic_enforce_mct_images_retention.delay()


# TODO(@lberg): remove once the periodic task is working
@retention_management_router.get("/enforce_retention_face_occurrences")
async def enforce_retention_face_occurrences(
    _app_user: auth_models.AppUser = Depends(auth.admin_user_role_guard),
) -> None:
    if not is_coram_employee_email(EmailStr(_app_user.user_email)):
        raise HTTPException(
            status_code=403, detail="Unauthorized to enforce thumbnails retention."
        )
    periodic_enforce_face_occurrences_retention.delay()


# TODO(@lberg): remove once the periodic task is working
@retention_management_router.get("/enforce_retention_detection_events")
async def enforce_retention_detections_events(
    _app_user: auth_models.AppUser = Depends(auth.admin_user_role_guard),
) -> None:
    if not is_coram_employee_email(EmailStr(_app_user.user_email)):
        raise HTTPException(
            status_code=403, detail="Unauthorized to enforce thumbnails retention."
        )
    periodic_enforce_perception_events_retention.delay()
