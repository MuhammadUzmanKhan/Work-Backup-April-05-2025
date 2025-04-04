import asyncio
import logging
from datetime import timedelta

import fastapi

from backend import auth, auth_models, dependencies, logging_config
from backend.access_logs.constants import UserActions
from backend.access_logs.utils import AccessLogger
from backend.admin.utils import (
    administration_is_enabled_check,
    check_user_is_device_manager_or_fail,
)
from backend.boto_utils import BotoSessionFn
from backend.constants import UNASSIGNED_TENANT
from backend.database import database
from backend.database import models as db_models
from backend.database import organization_models as db_organization_models
from backend.database import orm
from backend.database.models import CamerasQueryConfig
from backend.dependencies import get_backend_envs
from backend.envs import BackendEnvs
from backend.fastapi_utils import WithResponseExcludeNone
from backend.kinesis_api.models import KinesisLiveRetentionHoursUpdateRequest
from backend.kinesis_api.utils import live_kinesis_retention_update_request
from backend.models import CameraResponse, InternetStatus, NVRResponse
from backend.value_store import ValueStore, get_nvr_last_internet_status_key

logger = logging.getLogger(logging_config.LOGGER_NAME)

admin_router = WithResponseExcludeNone(
    fastapi.APIRouter(
        prefix="/admin",
        tags=["admin"],
        dependencies=[fastapi.Depends(administration_is_enabled_check)],
        generate_unique_id_function=lambda route: route.name,
    )
)


@admin_router.get("/organisations")
async def get_organisations(
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    _app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
) -> list[db_organization_models.Organization]:
    async with db.session() as session:
        organisations = await orm.Organization.system_get_orgs(session)
        return [
            organisation
            for organisation in organisations
            if organisation.tenant != UNASSIGNED_TENANT
        ]


@admin_router.post("/organisations/update_always_on_retention")
async def update_always_on_organisation_retention(
    retention_request: db_models.UpdateOrgStreamRetentionRequest,
    app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    boto_session_maker: BotoSessionFn = fastapi.Depends(
        dependencies.get_boto_session_maker
    ),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    backend_envs: BackendEnvs = fastapi.Depends(get_backend_envs),
    _access_logger: None = fastapi.Depends(
        AccessLogger(UserActions.UPDATED_ALWAYS_ON_RETENTION, ["retention_hours"])
    ),
) -> None:
    await check_user_is_device_manager_or_fail(
        app_user, backend_envs.devices_managers_emails
    )

    async with db.tenant_session(tenant=app_user.tenant) as session:
        always_on_stream_cameras: list[CameraResponse] = (
            await orm.orm_camera.Camera.get_always_on_cameras(session)
        )

    update_requests = [
        KinesisLiveRetentionHoursUpdateRequest(
            kvs_stream_name=camera.camera.stream_hash,
            retention_duration=timedelta(hours=retention_request.retention_hours),
        )
        for camera in always_on_stream_cameras
    ]

    failed_requests = []
    if len(always_on_stream_cameras) > 0:
        live_kinesis_retention_update_results = await asyncio.gather(
            *[
                live_kinesis_retention_update_request(
                    boto_session_maker=boto_session_maker, request=request
                )
                for request in update_requests
            ],
            return_exceptions=True,
        )

        for request, result in zip(
            update_requests, live_kinesis_retention_update_results
        ):
            if isinstance(result, Exception):
                failed_requests.append(request)
                logger.error(
                    f"update_retention for {request} caught exception: {result}"
                )

    if len(failed_requests) != 0:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=(
                "Failed to update kinesis stream retention hours for all always-on"
                " stream cameras!"
                f" Requested update for {len(always_on_stream_cameras)} streams,"
                f" updates for {failed_requests} failed!"
            ),
        )

    async with db.session() as session:
        success = await orm.Organization.system_update_always_on_retention_config(
            session=session,
            tenant=retention_request.tenant,
            retention_hours_always_on_streams=retention_request.retention_hours,
        )
        # It doesn't clean up and revert live_kinesis_retention_update_requests
        # if the update to the database fails.
        if not success:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Failed to update always-on stream retention hours for org ["
                    f"id={retention_request.tenant}]!"
                ),
            )


@admin_router.get("/nvrs")
async def get_nvrs(
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    value_store: ValueStore = fastapi.Depends(dependencies.get_value_store),
    _app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
) -> list[NVRResponse]:
    async with db.session() as session:
        nvrs = await orm.NVR.system_get_nvrs(
            session,
            query_config=db_models.NvrsQueryConfig(include_without_location=True),
        )

    last_internet_status_dict = await value_store.get_multiple_models(
        [get_nvr_last_internet_status_key(nvr.uuid) for nvr in nvrs], InternetStatus
    )

    for nvr in nvrs:
        nvr.internet_status = last_internet_status_dict.get(
            get_nvr_last_internet_status_key(nvr.uuid)
        )

    return nvrs


@admin_router.post("/nvrs/update_retention")
async def update_nvr_retention(
    retention_request: db_models.UpdateNvrRetentionRequest,
    app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    backend_envs: BackendEnvs = fastapi.Depends(get_backend_envs),
    _access_logger: None = fastapi.Depends(
        AccessLogger(UserActions.UPDATED_NVR_RETENTION, ["retention_days"])
    ),
) -> None:
    await check_user_is_device_manager_or_fail(
        app_user, backend_envs.devices_managers_emails
    )

    async with db.session() as session:
        success = await orm.NVR.system_update_nvr_retention(
            session=session,
            nvr_uuid=retention_request.nvr_uuid,
            retention_days=retention_request.retention_days,
        )

        if not success:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail="Failed to update NVR retention.",
            )


@admin_router.get("/nvrs/{nvr_uuid}/is_nvr_slots_locked")
async def is_nvr_slots_locked(
    nvr_uuid: str,
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    _app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
) -> bool:
    async with db.session() as session:
        return await orm.NVR.system_is_locked_max_cameras_slots(session, nvr_uuid)


@admin_router.post("/nvrs/lock_nvr_slots")
async def lock_nvr_slots(
    action: db_models.NVRSlotsLock,
    app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    backend_envs: BackendEnvs = fastapi.Depends(get_backend_envs),
    _access_logger: None = fastapi.Depends(
        AccessLogger(UserActions.LOCK_NVR_MAX_CAMERAS_SLOTS, ["nvr_uuid", "num_slots"])
    ),
) -> None:
    await check_user_is_device_manager_or_fail(
        app_user, backend_envs.devices_managers_emails
    )

    async with db.session() as session:
        await orm.NVR.system_set_lock_max_cameras_slots(session, action)


@admin_router.post("/nvrs/unlock_nvr_slots")
async def unlock_nvr_slots(
    action: db_models.NVRSlotsUnlock,
    app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    backend_envs: BackendEnvs = fastapi.Depends(get_backend_envs),
    _access_logger: None = fastapi.Depends(
        AccessLogger(UserActions.UNLOCK_NVR_MAX_CAMERAS_SLOTS, ["nvr_uuid"])
    ),
) -> None:
    await check_user_is_device_manager_or_fail(
        app_user, backend_envs.devices_managers_emails
    )

    async with db.session() as session:
        await orm.NVR.system_set_lock_max_cameras_slots(session, action)


@admin_router.post("/nvrs/{nvr_uuid}/unassign")
async def unassign_nvr(
    nvr_uuid: str,
    app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    backend_envs: BackendEnvs = fastapi.Depends(get_backend_envs),
    _access_logger: None = fastapi.Depends(
        AccessLogger(UserActions.UNASSIGN_NVR, ["nvr_uuid"])
    ),
) -> None:
    await check_user_is_device_manager_or_fail(
        app_user, backend_envs.devices_managers_emails
    )

    async with db.session() as session:
        await orm.NVR.system_unassign_nvr(session, nvr_uuid)


@admin_router.get("/cameras")
async def get_cameras(
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    _app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
) -> list[CameraResponse]:
    async with db.session() as session:
        return await orm.orm_camera.Camera.system_get_cameras(
            session, CamerasQueryConfig()
        )
