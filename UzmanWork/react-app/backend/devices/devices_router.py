import logging
from datetime import timedelta

import fastapi
from fastapi import HTTPException

from backend import auth, auth_models, dependencies, logging_config
from backend.access_logs.constants import UserActions
from backend.access_logs.utils import AccessLogger
from backend.boto_utils import BotoSessionFn
from backend.constants import DEFAULT_LIVE_STREAM_RETENTION_DUR
from backend.database import database, models, orm
from backend.database.orm.orm_camera import CameraError
from backend.database.orm.orm_location import LocationError
from backend.devices.constants import RECENT_CAMERA_PIPELINE_ALERTS_INTERVAL
from backend.devices.devices_models import (
    CameraGroupCreateRequest,
    CameraPipelineAlertResponse,
    CamerasExportRequest,
    DeleteCameraRequest,
    NVRRegistration,
    NvrsExportRequest,
    UpdateLocationAddressRequest,
    UpdateLocationEnableSettingTimezoneRequest,
    UpdateLocationNameRequest,
    UpdateLocationTimezoneRequest,
)
from backend.devices.utils import (
    unassign_camera_from_tenant,
    user_has_access_to_location,
)
from backend.fastapi_utils import WithResponseExcludeNone
from backend.kinesis_api.errors import KinesisError
from backend.kinesis_api.models import KinesisLiveRetentionHoursUpdateRequest
from backend.kinesis_api.utils import live_kinesis_retention_update_request
from backend.models import (
    AccessRestrictions,
    InternetStatus,
    NvrKvsConnectionStatus,
    NVRResponse,
)
from backend.monitor.models import CameraPipelineAlertCreate
from backend.organization_feature_flags.utils import get_org_or_fail
from backend.router_utils import (
    check_camera_access,
    get_camera_from_mac_address_or_fail,
    get_nvr_response_from_uuid_or_fail,
)
from backend.utils import AwareDatetime
from backend.value_store import ValueStore, get_nvr_last_internet_status_key
from backend.value_store.value_store import (
    get_camera_pipeline_alert_key,
    get_nvr_kvs_connection_status_key,
    get_recent_camera_pipeline_alerts_key,
)

logger = logging.getLogger(logging_config.LOGGER_NAME)

devices_router = WithResponseExcludeNone(
    fastapi.APIRouter(
        prefix="/devices",
        tags=["devices"],
        generate_unique_id_function=lambda route: route.name,
    )
)


@devices_router.get("/nvrs")
async def nvrs(
    location_id: int | None = None,
    _app_user: auth_models.AppUser = fastapi.Depends(auth.live_only_user_role_guard),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    value_store: ValueStore = fastapi.Depends(dependencies.get_value_store),
    access: AccessRestrictions = fastapi.Depends(auth.get_user_access_restrictions),
) -> list[NVRResponse]:
    """Get the list of NVR devices for a given organization and optionally
    location.

    :param organization_id: ID of an organization.
    :param location_id: Optional ID of a location.
    :return: List of NVR devices to display.
    """
    async with db.tenant_session() as session:
        nvrs = await orm.NVR.get_nvrs(session, access, location_id)

    # fetch internet status for all nvrs from the value_store
    last_internet_status_dict = await value_store.get_multiple_models(
        [get_nvr_last_internet_status_key(nvr.uuid) for nvr in nvrs], InternetStatus
    )

    kvs_connection_status_dict = await value_store.get_multiple_models(
        [get_nvr_kvs_connection_status_key(nvr.uuid) for nvr in nvrs],
        NvrKvsConnectionStatus,
    )

    for nvr in nvrs:
        nvr.internet_status = last_internet_status_dict.get(
            get_nvr_last_internet_status_key(nvr.uuid)
        )
        nvr.kvs_connection_status = kvs_connection_status_dict.get(
            get_nvr_kvs_connection_status_key(nvr.uuid)
        )

    return nvrs


@devices_router.post("/create_group")
async def create_group(
    create_request: CameraGroupCreateRequest,
    _app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    _access_logger: None = fastapi.Depends(
        AccessLogger(UserActions.CREATED_A_NEW_CAMERA_GROUP, ["name"])
    ),
) -> int:
    """Create a new camera group, return the ID of the newly created group."""
    async with db.tenant_session() as session:
        groups = await orm.CameraGroup.get_allowed_groups(session, AccessRestrictions())
        group_names = [group.name for group in groups]
        if create_request.name in group_names:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail="The group already exists",
            )
        group = await orm.CameraGroup.new_group(
            session,
            group_metadata=models.CameraGroupCreate(
                name=create_request.name, is_default=False
            ),
        )
    return group.id


@devices_router.get("/validate_nvr")
async def validate_nvr_code(
    code: str,
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    _app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
) -> bool:
    """Validate a user provided uuid code for registering a new NVR device.

    :param code: The uuid that the user provided.
    :return: True if the code is correct and the device is not registered
        already.
    """

    # this has to run in a system session as the NVR is still not
    # part of the organization
    async with db.session() as session:
        return await orm.NVR.system_validate_nvr_code(session, code)


# TODO: should we update retention days here
@devices_router.post("/register_nvr")
async def register_nvr(
    nvr_registration: NVRRegistration,
    app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    _access_logger: None = fastapi.Depends(
        AccessLogger(UserActions.ADDED_A_NEW_NVR_DEVICE)
    ),
) -> bool:
    async with db.tenant_session() as session:
        location_owner = await orm.Location.get_location_owner(
            session, nvr_registration.location_id
        )
        if location_owner is None:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail="The user has no access to the location",
            )

    # this has to run in a system session as the NVR is still not
    # part of the organization
    async with db.session() as session:
        success = await orm.NVR.system_register_nvr(
            session,
            nvr_registration.uuid,
            nvr_registration.location_id,
            tenant=app_user.tenant,
        )

    return success


@devices_router.post("/create_location")
async def create_location(
    location_data: models.LocationCreate,
    _app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    _access_logger: None = fastapi.Depends(
        AccessLogger(UserActions.CREATED_A_NEW_LOCATION, ["name", "address"])
    ),
) -> int:
    async with db.tenant_session() as session:
        try:
            location = await orm.Location.new_location(session, location_data)
        except LocationError as e:
            raise HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail=f"Error while creating a new location: {e}",
            )
    return location.id


@devices_router.post("/update_location_name")
async def update_location_name(
    update_request: UpdateLocationNameRequest,
    _app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    access: AccessRestrictions = fastapi.Depends(auth.get_user_access_restrictions),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    _access_logger: None = fastapi.Depends(
        AccessLogger(UserActions.UPDATED_LOCATION_NAME, ["name"])
    ),
) -> str:
    async with db.tenant_session() as session:
        try:
            await orm.Location.update_location_name(
                session,
                location_id=update_request.location_id,
                name=update_request.name,
                access_restrictions=access,
            )
        except LocationError as e:
            raise HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail=f"Error while updating location name: {e}",
            )

    return update_request.name


@devices_router.post("/update_location_address")
async def update_location_address(
    update_request: UpdateLocationAddressRequest,
    _app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    access: AccessRestrictions = fastapi.Depends(auth.get_user_access_restrictions),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    _access_logger: None = fastapi.Depends(
        AccessLogger(UserActions.UPDATED_LOCATION_ADDRESS, ["address"])
    ),
) -> str:
    async with db.tenant_session() as session:
        try:
            await orm.Location.update_location_address(
                session,
                location_id=update_request.location_id,
                address=update_request.address,
                access_restrictions=access,
            )
        except LocationError as e:
            raise HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail=f"Error while updating location address: {e}",
            )

    return update_request.address


@devices_router.post("/update_location_enable_setting_timezone")
async def update_location_enable_setting_timezone(
    request: UpdateLocationEnableSettingTimezoneRequest,
    app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    access: AccessRestrictions = fastapi.Depends(auth.get_user_access_restrictions),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    _access_logger: None = fastapi.Depends(
        AccessLogger(
            UserActions.UPDATED_LOCATION_ENABLE_SETTING_TIMEZONE,
            ["enable_setting_timezone"],
        )
    ),
) -> bool:
    async with db.tenant_session() as session:
        try:
            await orm.Location.update_location_enable_setting_timezone(
                session,
                location_id=request.location_id,
                enable_setting_timezone=request.enable_setting_timezone,
                access_restrictions=access,
            )
            if not request.enable_setting_timezone:
                await orm.Location.reset_location_timezone_to_the_first_associated_nvr(
                    session, request.location_id
                )
        except LocationError as e:
            raise HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail=f"Error while updating location timezone: {e}",
            )

    return request.enable_setting_timezone


@devices_router.post("/update_location_timezone")
async def update_location_timezone(
    request: UpdateLocationTimezoneRequest,
    _app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    access: AccessRestrictions = fastapi.Depends(auth.get_user_access_restrictions),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    _access_logger: None = fastapi.Depends(
        AccessLogger(UserActions.UPDATED_LOCATION_TIMEZONE, ["timezone"])
    ),
) -> str:
    async with db.tenant_session() as session:
        try:
            await orm.Location.update_location_timezone(
                session,
                location_id=request.location_id,
                timezone=request.timezone,
                access_restrictions=access,
            )
        except LocationError as e:
            raise HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail=f"Error while updating location timezone: {e}",
            )

    return request.timezone


@devices_router.delete("/delete_location/{location_id}")
async def delete_location(
    location_id: int,
    _app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    _access_logger: None = fastapi.Depends(
        AccessLogger(UserActions.DELETED_A_LOCATION, ["location_id"])
    ),
) -> None:
    async with db.tenant_session() as session:
        try:
            await orm.Location.delete_location(session, location_id)
        except LocationError as e:
            raise HTTPException(
                status_code=fastapi.status.HTTP_409_CONFLICT,
                detail=f"Error while deleting location: {e}",
            )


@devices_router.post("/delete_camera")
async def delete_camera(
    request: DeleteCameraRequest,
    _app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    access: AccessRestrictions = fastapi.Depends(auth.get_user_access_restrictions),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    _access_logger: None = fastapi.Depends(
        AccessLogger(UserActions.DELETED_A_CAMERA, ["mac_address"])
    ),
) -> None:
    mac_address = request.mac_address

    async with db.tenant_session() as session:
        await check_camera_access(session, access, [mac_address])

    async with db.session() as session:
        await unassign_camera_from_tenant(mac_address, session)


@devices_router.post("/update_nvr_location")
async def update_nvr_location(
    update_request: models.UpdateNvrLocationRequest,
    _app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    _access_logger: None = fastapi.Depends(
        AccessLogger(UserActions.UPDATED_NVR_LOCATION, ["location_id"])
    ),
) -> None:
    async with db.tenant_session() as session:
        if not await user_has_access_to_location(session, update_request.location_id):
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail="The user has no access to the location",
            )

        success = await orm.NVR.update_nvr_location(
            session=session,
            nvr_uuid=update_request.nvr_uuid,
            location_id=update_request.location_id,
        )

        if not success:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail="Failed to update the location.",
            )


@devices_router.post("/enable_camera")
async def enable_camera(
    camera_id: int,
    _app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    access: AccessRestrictions = fastapi.Depends(auth.get_user_access_restrictions),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    _access_logger: None = fastapi.Depends(
        AccessLogger(user_action=UserActions.ENABLED_A_CAMERA)
    ),
) -> None:
    async with db.tenant_session() as session:
        camera: orm.Camera | None = await session.get(orm.Camera, camera_id)
        if camera is None:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_404_NOT_FOUND,
                detail="Camera with the given id was not found.",
            )

        if camera.is_enabled:
            return

        nvr = await get_nvr_response_from_uuid_or_fail(session, access, camera.nvr_uuid)
        if nvr.num_available_cameras_slots <= 0:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_409_CONFLICT, detail="NVR over capacity"
            )

        camera.is_enabled = True


@devices_router.post("/disable_camera")
async def disable_camera(
    camera_id: int,
    _app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    _access_logger: None = fastapi.Depends(
        AccessLogger(user_action=UserActions.DISABLED_A_CAMERA)
    ),
) -> None:
    async with db.tenant_session() as session:
        try:
            await orm.Camera.disable_camera(session, camera_id)
        except CameraError:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail="No permission to update the camera",
            )


@devices_router.post("/rename_camera")
async def rename_camera(
    camera_id: int,
    name: str = fastapi.Body(min_length=1),
    _app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    _access_logger: None = fastapi.Depends(AccessLogger(UserActions.RENAMED_A_CAMERA)),
) -> None:
    async with db.tenant_session() as session:
        try:
            await orm.Camera.rename_camera(
                session, camera_id=camera_id, camera_name=name
            )
        except CameraError:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail="No permission to update the camera",
            )


@devices_router.post("/update_camera_group")
async def update_camera_group(
    camera_id: int,
    group_id: int,
    _app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    _access_logger: None = fastapi.Depends(
        AccessLogger(user_action=UserActions.UPDATED_A_CAMERA_GROUP)
    ),
) -> None:
    async with db.tenant_session() as session:
        try:
            await orm.Camera.update_camera_group(
                session, camera_id=camera_id, group_id=group_id
            )
        except CameraError:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail="No permission to update the camera",
            )


@devices_router.delete("/delete_camera_group")
async def delete_camera_group(
    camera_id: int,
    _app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    _access_logger: None = fastapi.Depends(
        AccessLogger(user_action=UserActions.DELETED_A_CAMERA_GROUP)
    ),
) -> None:
    async with db.tenant_session() as session:
        try:
            default_group = await orm.CameraGroup.get_tenant_default_group(session)
            await orm.Camera.update_camera_group(
                session, camera_id=camera_id, group_id=default_group.id
            )
        except CameraError:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail="No permission to update the camera",
            )


@devices_router.post("/update_camera_credentials")
async def update_camera_credentials(
    update_credentials_request: models.UpdateCameraCredentialsRequest,
    _app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    access: AccessRestrictions = fastapi.Depends(auth.get_user_access_restrictions),
    _access_logger: None = fastapi.Depends(
        AccessLogger(
            UserActions.UPDATED_A_CAMERA_CREDENTIALS,
            ["username", "password", "mac_address"],
        )
    ),
) -> None:
    async with db.tenant_session() as session:
        await check_camera_access(
            session, access, [update_credentials_request.mac_address]
        )
        await orm.Camera.update_camera_credentials(
            session,
            mac_address=update_credentials_request.mac_address,
            username=update_credentials_request.username,
            should_update_username=update_credentials_request.should_update_username,
            password=update_credentials_request.password,
            should_update_password=update_credentials_request.should_update_password,
        )


@devices_router.post("/update_camera_video_orientation_type")
async def update_camera_video_orientation_type(
    update_video_orientation_type: models.UpdateCameraVideoOrientationType,
    _app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    access: AccessRestrictions = fastapi.Depends(auth.get_user_access_restrictions),
    _access_logger: None = fastapi.Depends(
        AccessLogger(
            UserActions.UPDATED_A_CAMERA_VIDEO_ORIENTATION_TYPE,
            ["video_orientation_type", "mac_address"],
        )
    ),
) -> None:
    async with db.tenant_session() as session:
        await check_camera_access(
            session, access, [update_video_orientation_type.mac_address]
        )

        await orm.Camera.update_camera_video_orientation_type(
            session,
            mac_address=update_video_orientation_type.mac_address,
            video_orientation_type=update_video_orientation_type.video_orientation_type,
        )


@devices_router.post("/update_camera_rtsp_url")
async def update_camera_rtsp_url(
    update_request: models.UpdateCameraRtspUrlRequest,
    _app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    access: AccessRestrictions = fastapi.Depends(auth.get_user_access_restrictions),
    _access_logger: None = fastapi.Depends(
        AccessLogger(UserActions.UPDATED_A_CAMERA_RTSP_URL, ["rtsp_url", "mac_address"])
    ),
) -> None:
    async with db.tenant_session() as session:
        await check_camera_access(session, access, [update_request.mac_address])
        await orm.Camera.update_camera_rtsp_url(
            session,
            mac_address=update_request.mac_address,
            rtsp_url=update_request.rtsp_url,
        )


async def _update_retention_for_camera_or_fail(
    camera: models.Camera,
    mac_address: str,
    retention_hours_always_on_streams: int,
    boto_session_maker: BotoSessionFn,
    is_always_streaming: bool,
) -> None:
    try:
        await live_kinesis_retention_update_request(
            boto_session_maker,
            KinesisLiveRetentionHoursUpdateRequest(
                kvs_stream_name=camera.source,
                retention_duration=(
                    timedelta(hours=retention_hours_always_on_streams)
                    if is_always_streaming
                    else DEFAULT_LIVE_STREAM_RETENTION_DUR
                ),
            ),
        )
    except KinesisError as e:
        logger.error(
            "Failed to update the retention duration for camera: "
            f"{mac_address} with error: {e}"
        )

        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update the retention duration for camera: {mac_address}",
        )


@devices_router.post("/update_camera_flag")
async def update_camera_flag(
    update_request: models.UpdateCameraFlag,
    _app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    access: AccessRestrictions = fastapi.Depends(auth.get_user_access_restrictions),
    boto_session_maker: BotoSessionFn = fastapi.Depends(
        dependencies.get_boto_session_maker
    ),
    _access_logger: None = fastapi.Depends(
        AccessLogger(
            UserActions.UPDATED_A_CAMERA_FLAG,
            ["flag_enum", "flag_value", "mac_address"],
        )
    ),
) -> None:
    async with db.tenant_session() as session:
        camera = await get_camera_from_mac_address_or_fail(
            session, access, update_request.mac_address
        )
        org = await get_org_or_fail(session)

    if update_request.flag_enum == models.CameraFlag.IS_ALWAYS_STREAMING:
        await _update_retention_for_camera_or_fail(
            camera=camera,
            mac_address=update_request.mac_address,
            retention_hours_always_on_streams=org.retention_hours_always_on_streams,
            boto_session_maker=boto_session_maker,
            is_always_streaming=update_request.flag_value,
        )

    async with db.tenant_session() as session:
        await orm.Camera.update_camera_flag(
            session,
            mac_address=update_request.mac_address,
            flag_enum=update_request.flag_enum,
            flag_value=update_request.flag_value,
        )


@devices_router.post("/update_webrtc_bulk_flag")
async def update_webrtc_bulk_flag(
    update_request: models.UpdateCamerasWebrtcFlag,
    _app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    access: AccessRestrictions = fastapi.Depends(auth.get_user_access_restrictions),
) -> None:
    async with db.tenant_session() as session:
        await check_camera_access(session, access, update_request.mac_addresses)

        await orm.Camera.update_cameras_flag(
            session,
            mac_addresses=update_request.mac_addresses,
            flag_enum=models.CameraFlag.WEBRTC_ENABLED,
            flag_value=update_request.flag_value,
        )


@devices_router.post("/get_camera_pipeline_alerts")
async def get_camera_pipeline_alerts(
    mac_addresses: list[str],
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    value_store: ValueStore = fastapi.Depends(dependencies.get_value_store),
    _app_user: auth_models.AppUser = fastapi.Depends(auth.live_only_user_role_guard),
    access: AccessRestrictions = fastapi.Depends(auth.get_user_access_restrictions),
) -> CameraPipelineAlertResponse:
    async with db.tenant_session() as session:
        await check_camera_access(session, access, mac_addresses)

    alerts_dict = await value_store.get_multiple_models(
        keys=[get_camera_pipeline_alert_key(mac) for mac in mac_addresses],
        model_class=CameraPipelineAlertCreate,
    )
    response = CameraPipelineAlertResponse(
        alerts_info={
            mac: alerts_dict.get(get_camera_pipeline_alert_key(mac))
            for mac in mac_addresses
        }
    )
    return response


@devices_router.get("/get_recent_camera_pipeline_alerts")
async def get_recent_camera_pipeline_alerts(
    mac_address: str,
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    value_store: ValueStore = fastapi.Depends(dependencies.get_value_store),
    _app_user: auth_models.AppUser = fastapi.Depends(auth.live_only_user_role_guard),
    access: AccessRestrictions = fastapi.Depends(auth.get_user_access_restrictions),
) -> list[CameraPipelineAlertCreate]:
    async with db.tenant_session() as session:
        await check_camera_access(session, access, [mac_address])

    alerts_dict = await value_store.hgetall_models(
        key=get_recent_camera_pipeline_alerts_key(mac_address),
        model_class=CameraPipelineAlertCreate,
    )

    current_time = AwareDatetime.utcnow()
    return [
        alert
        for alert in alerts_dict.values()
        if alert.time_generated > current_time - RECENT_CAMERA_PIPELINE_ALERTS_INTERVAL
    ]


@devices_router.post("/cameras_export")
async def request_cameras_export(
    export_request: CamerasExportRequest,
    app_user: auth_models.AppUser = fastapi.Depends(auth.regular_user_role_guard),
    _access_logger: None = fastapi.Depends(
        AccessLogger(UserActions.REQUEST_CAMERAS_EXPORT, ["format"])
    ),
) -> None:
    # NOTE(@lberg): this endpoint is not doing anything inside, this feature
    # is currently provided by the frontend. However, it provide
    # validation for the user, logs the request and might include some logic
    # in the future.
    return None


@devices_router.post("/nvrs_export")
async def request_nvrs_export(
    export_request: NvrsExportRequest,
    app_user: auth_models.AppUser = fastapi.Depends(auth.regular_user_role_guard),
    _access_logger: None = fastapi.Depends(
        AccessLogger(UserActions.REQUEST_NVRS_EXPORT, ["format"])
    ),
) -> None:
    # NOTE(@lberg): this endpoint is not doing anything inside, this feature
    # is currently provided by the frontend. However, it provide
    # validation for the user, logs the request and might include some logic
    # in the future.
    return None
