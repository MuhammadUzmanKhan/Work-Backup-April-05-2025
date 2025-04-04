import logging

import fastapi
from fastapi import Depends

from backend import auth, auth_models, dependencies, logging_config
from backend.camera import models
from backend.database import database, orm
from backend.database.models import CamerasQueryConfig
from backend.fastapi_utils import WithResponseExcludeNone
from backend.models import AccessRestrictions, CameraResponse
from backend.router_utils import check_camera_access, resolve_id_to_mac_address_or_fail
from backend.utils import AwareDatetime

logger = logging.getLogger(logging_config.LOGGER_NAME)

cameras_router = WithResponseExcludeNone(
    fastapi.APIRouter(
        prefix="/cameras",
        tags=["cameras"],
        generate_unique_id_function=lambda route: route.name,
    )
)


@cameras_router.get("/")
async def get_cameras(
    nvr_uuid: str | None = None,
    location_id: int | None = None,
    exclude_disabled: bool = False,
    app_user: auth_models.AppUser = Depends(auth.live_only_user_role_guard),
    db: database.Database = Depends(dependencies.get_backend_database),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
) -> list[CameraResponse]:
    """Retrieve cameras based on provided filters."""
    async with db.tenant_session() as session:
        return await orm.Camera.get_cameras(
            session,
            query_config=CamerasQueryConfig(
                nvr_uuids={nvr_uuid} if nvr_uuid is not None else None,
                location_ids={location_id} if location_id is not None else None,
                exclude_disabled=exclude_disabled,
            ),
            access_restrictions=access,
        )


@cameras_router.get("/{camera_id}")
async def get_camera(
    camera_id: int,
    app_user: auth_models.AppUser = Depends(auth.live_only_user_role_guard),
    db: database.Database = Depends(dependencies.get_backend_database),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
) -> CameraResponse:
    """Retrieve a single camera.
    NOTE: we use the camera_id here because we parse it from the URL where
    it's easier for the users compared to the mac_address.
    """
    async with db.tenant_session() as session:
        mac_address = await resolve_id_to_mac_address_or_fail(session, camera_id)
        cameras = await orm.Camera.get_cameras(
            session,
            query_config=CamerasQueryConfig(mac_addresses={mac_address}),
            access_restrictions=access,
        )
        if len(cameras) != 1:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail="Camera not found",
            )
    return cameras[0]


@cameras_router.get("/downtime/{camera_id}")
async def get_camera_downtime(
    camera_id: int,
    time_start: AwareDatetime,
    time_end: AwareDatetime,
    _app_user: auth_models.AppUser = Depends(auth.live_only_user_role_guard),
    db: database.Database = Depends(dependencies.get_backend_database),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
) -> models.GetCameraDowntimeResponse:
    async with db.tenant_session() as session:
        mac_address = await resolve_id_to_mac_address_or_fail(session, camera_id)
        await check_camera_access(
            session=session, access=access, mac_addresses=[mac_address]
        )

        downtimes = await orm.CameraDowntime.get_downtimes_for_camera(
            session,
            camera_mac_address=mac_address,
            time_start=time_start,
            time_end=time_end,
        )
        return models.GetCameraDowntimeResponse(downtimes=downtimes)
