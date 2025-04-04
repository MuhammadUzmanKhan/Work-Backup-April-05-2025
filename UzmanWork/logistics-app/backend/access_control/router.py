import logging

import fastapi
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse

from backend import auth, auth_models, logging_config
from backend.access_control import models
from backend.access_control.utils import (
    fetch_api_access_points,
    get_access_point_or_fail,
)
from backend.access_logs.constants import UserActions
from backend.access_logs.utils import AccessLogger
from backend.database import access_points_models as ap_models
from backend.database import database, orm
from backend.database.brivo_integration_models import BrivoIntegrationError
from backend.dependencies import (
    get_alta_client,
    get_backend_database,
    get_backend_envs,
    get_brivo_client,
    get_value_store,
)
from backend.envs import BackendEnvs
from backend.fastapi_utils import WithResponseExcludeNone
from backend.models import AccessRestrictions
from backend.value_store import ValueStore

from .alta import utils as alta_utils
from .alta.client import AltaClient
from .alta.models import AltaError
from .brivo import utils as brivo_utils
from .brivo.client import BrivoClient
from .brivo.models import BrivoError

logger = logging.getLogger(logging_config.LOGGER_NAME)

access_control_router = WithResponseExcludeNone(
    APIRouter(
        prefix="/access_control",
        tags=["access_control"],
        generate_unique_id_function=lambda route: route.name,
    )
)


@access_control_router.get("/list_integrations")
async def list_integrations(
    db: database.Database = Depends(get_backend_database),
    _app_user: auth_models.AppUser = Depends(auth.admin_user_role_guard),
) -> list[models.AccessControlIntegration]:
    async with db.tenant_session() as session:
        brivo_integration = await brivo_utils.get_brivo_integration(session)
        alta_integration = await alta_utils.get_alta_integration(session)

    return [
        integration
        for integration in [brivo_integration, alta_integration]
        if integration is not None
    ]


@access_control_router.delete("/integrations/{vendor}")
async def delete_integrations(
    vendor: ap_models.AccessPointVendor,
    db: database.Database = Depends(get_backend_database),
    _app_user: auth_models.AppUser = Depends(auth.admin_user_role_guard),
    _access_logger: AccessLogger = Depends(
        AccessLogger(UserActions.DELETED_INTEGRATION, ["vendor"])
    ),
) -> None:
    async with db.tenant_session() as session:
        if vendor == ap_models.AccessPointVendor.BRIVO:
            await brivo_utils.remove_brivo_integration(session)
        elif vendor == ap_models.AccessPointVendor.ALTA:
            await alta_utils.remove_alta_integration(session)


@access_control_router.post("/access_points/actions/unlock")
async def unlock_access_point(
    request: models.UnlockAccessPointRequest,
    db: database.Database = Depends(get_backend_database),
    alta_client: AltaClient = Depends(get_alta_client),
    brivo_client: BrivoClient = Depends(get_brivo_client),
    app_user: auth_models.AppUser = Depends(auth.admin_user_role_guard),
    value_store: ValueStore = Depends(get_value_store),
    _access_logger: AccessLogger = Depends(
        AccessLogger(UserActions.UNLOCK_ACCESS_POINT, ["id", "vendor"])
    ),
) -> None:
    access_point = await get_access_point_or_fail(request.id, request.vendor, db)

    if request.vendor == ap_models.AccessPointVendor.ALTA:
        try:
            await alta_utils.unlock_alta_access_point(
                access_point_id=access_point.id, alta_client=alta_client, db=db
            )
        except AltaError as e:
            logger.error(f"Error while unlocking Alta Access Point: {e}")
            raise HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail=f"Error while unlocking Alta Access Point: {e}",
            )

    elif request.vendor == ap_models.AccessPointVendor.BRIVO:
        try:
            await brivo_utils.unlock_brivo_access_point(
                access_point_id=access_point.id,
                brivo_client=brivo_client,
                tenant=app_user.tenant,
                db=db,
                value_store=value_store,
            )
        except BrivoError as e:
            logger.error(f"Error while unlocking Brivo Access Point: {e}")
            raise HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail=f"Error while unlocking Brivo Access Point: {e}",
            )


@access_control_router.get("/authorize_brivo")
async def authorize_brivo(
    code: str,
    state: str,
    brivo_client: BrivoClient = Depends(get_brivo_client),
    db: database.Database = Depends(get_backend_database),
    backend_envs: BackendEnvs = Depends(get_backend_envs),
    value_store: ValueStore = Depends(get_value_store),
) -> RedirectResponse:
    """API hook for Brivo to authorize user account integration."""

    async with db.session() as session:
        # Check whether the state corresponds to an existing tenant
        organizations = await orm.Organization.system_get_orgs(session, [state])
        if len(organizations) != 1:
            raise HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail=f"Organization {state} does not exist",
            )

    try:
        await brivo_utils.create_brivo_access_control_integration(
            authorization_code=code,
            brivo_client=brivo_client,
            tenant=state,
            db=db,
            value_store=value_store,
        )
    except BrivoError as e:
        logger.error(f"Error while authorizing with Brivo: {e}")
        raise HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=f"Error while authorizing with Brivo: {e}",
        )

    return RedirectResponse(
        url=f"{backend_envs.web_app_url}/integrations/auth/success-cb?provider=Brivo"
    )


@access_control_router.post("/brivo/set-api-key")
async def brivo_set_api_key(
    request: models.BrivoSetApiKeyRequest,
    app_user: auth_models.AppUser = Depends(auth.admin_user_role_guard),
    brivo_client: BrivoClient = Depends(get_brivo_client),
    db: database.Database = Depends(get_backend_database),
    value_store: ValueStore = Depends(get_value_store),
) -> None:
    try:
        await brivo_utils.set_api_key(
            api_key=request.api_key,
            brivo_client=brivo_client,
            tenant=app_user.tenant,
            db=db,
            value_store=value_store,
        )
    except BrivoError as e:
        logger.error(f"Failed to set Brivo API Key {e}")
        raise HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=f"API Key is not valid {e}",
        )


@access_control_router.get("/brivo/get-api-key")
async def brivo_get_api_key(
    _app_user: auth_models.AppUser = Depends(auth.admin_user_role_guard),
    db: database.Database = Depends(get_backend_database),
) -> models.BrivoGetApiKeyResponse:
    async with db.tenant_session() as session:
        try:
            api_key = await orm.BrivoIntegration.get_api_key(session)
        except BrivoIntegrationError as e:
            logger.error(f"Error while getting Brivo api key: {e}")
            raise HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail=f"Error while getting Brivo api key: {e}",
            )
    return models.BrivoGetApiKeyResponse(api_key=api_key)


@access_control_router.post("/authorize_alta")
async def authorize_alta(
    request: models.AuthorizeAltaRequest,
    db: database.Database = Depends(get_backend_database),
    alta_client: AltaClient = Depends(get_alta_client),
    app_user: auth_models.AppUser = Depends(auth.admin_user_role_guard),
) -> models.AccessControlIntegration:
    try:
        return await alta_utils.create_alta_access_control_integration(
            request=request, alta_client=alta_client, tenant=app_user.tenant, db=db
        )
    except AltaError as e:
        logger.error(f"Error while authorizing with Alta: {e}")
        raise HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=f"Error while authorizing with Alta: {e}",
        )


@access_control_router.get("/list_access_points")
async def list_access_points(
    brivo_client: BrivoClient = Depends(get_brivo_client),
    alta_client: AltaClient = Depends(get_alta_client),
    db: database.Database = Depends(get_backend_database),
    value_store: ValueStore = Depends(get_value_store),
    app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
) -> list[models.AccessPointResponse]:
    api_access_points = await fetch_api_access_points(
        tenant=app_user.tenant,
        brivo_client=brivo_client,
        alta_client=alta_client,
        db=db,
        value_store=value_store,
    )

    # Combine API Access Points and Remove Duplicates
    api_access_points_ids = set(
        ap_models.AccessPointIdentifier(id=ap.id, vendor=ap.vendor)
        for ap in api_access_points
    )

    async with db.tenant_session() as session:
        db_access_points = await orm.AccessPoint.get_access_points(session)

        # Find Access Points in Database
        db_access_points_lookup = {
            ap_models.AccessPointIdentifier(id=ap.id, vendor=ap.vendor): ap
            for ap in db_access_points
        }

        # Identify New and Stale Access Points
        new_access_points = [
            ap
            for ap in api_access_points
            if ap_models.AccessPointIdentifier(id=ap.id, vendor=ap.vendor)
            not in db_access_points_lookup
        ]

        stale_access_points = [
            ap
            for key, ap in db_access_points_lookup.items()
            if key not in api_access_points_ids
        ]

        # Add New Access Points to Database
        for new_access_point in new_access_points:
            await orm.AccessPoint.create_access_point(
                session,
                ap_models.AccessPointIdentifier(
                    id=new_access_point.id, vendor=new_access_point.vendor
                ),
            )

        # Remove Stale Access Points from Database
        stale_access_point_ids = [
            ap_models.AccessPointIdentifier(id=ap.id, vendor=ap.vendor)
            for ap in stale_access_points
        ]

        await orm.AccessPoint.delete_access_points(session, stale_access_point_ids)

    for ap in api_access_points:
        db_access_point = db_access_points_lookup.get(
            ap_models.AccessPointIdentifier(id=ap.id, vendor=ap.vendor)
        )
        if db_access_point:
            ap.location_id = db_access_point.location_id
            ap.cameras = [
                models.AccessPointCameraInfo(
                    mac_address=c.camera_mac_address, is_favorite=c.is_favorite
                )
                for c in db_access_point.cameras
            ]

    return api_access_points


@access_control_router.post("/set_location")
async def set_location(
    request: models.SetAccessPointLocationRequest,
    db: database.Database = Depends(get_backend_database),
    _app_user: auth_models.AppUser = Depends(auth.admin_user_role_guard),
) -> None:
    async with db.tenant_session() as session:
        try:
            await orm.AccessPoint.set_location(
                session=session,
                ap_identifier=ap_models.AccessPointIdentifier(
                    id=request.access_point_id, vendor=request.vendor
                ),
                location_id=request.location_id,
            )
        except ap_models.AccessPointError as e:
            logger.error(f"Failed to set location {e}")
            raise HTTPException(
                status_code=fastapi.status.HTTP_404_NOT_FOUND, detail=str(e)
            )


@access_control_router.post("/assign_camera")
async def assign_camera(
    request: models.AssignAccessPointCameraRequest,
    db: database.Database = Depends(get_backend_database),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    _app_user: auth_models.AppUser = Depends(auth.admin_user_role_guard),
    _access_logger: AccessLogger = Depends(
        AccessLogger(
            UserActions.ASSIGNED_CAMERA,
            ["access_point_id", "vendor", "camera_mac_address"],
        )
    ),
) -> None:
    async with db.tenant_session() as session:
        if not await orm.Camera.user_has_access_to_mac_addresses(
            session, [request.camera_mac_address], access
        ):
            raise HTTPException(
                status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
                detail="User does not have access to the camera",
            )

        access_point = await get_access_point_or_fail(
            access_point_id=request.access_point_id, vendor=request.vendor, db=db
        )

        if access_point.location_id is None:
            raise HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail="Access point is not associated with a location",
            )

        # Assign camera to the access point
        is_the_only_ap_camera = len(access_point.cameras) == 0
        try:
            await orm.AccessPoint.assign_camera(
                session=session,
                ap_identifier=ap_models.AccessPointIdentifier(
                    id=request.access_point_id, vendor=request.vendor
                ),
                camera_mac_address=request.camera_mac_address,
                mark_as_favorite=is_the_only_ap_camera,
            )
        except ap_models.AccessPointError as ex:
            raise HTTPException(
                status_code=fastapi.status.HTTP_404_NOT_FOUND, detail=str(ex)
            )


@access_control_router.post("/unassign_camera")
async def unassign_camera(
    request: models.UnassignAccessPointCameraRequest,
    db: database.Database = Depends(get_backend_database),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    _app_user: auth_models.AppUser = Depends(auth.admin_user_role_guard),
    _access_logger: AccessLogger = Depends(
        AccessLogger(
            UserActions.UNASSIGNED_CAMERA,
            ["access_point_id", "vendor", "camera_mac_address"],
        )
    ),
) -> None:
    async with db.tenant_session() as session:
        if not await orm.Camera.user_has_access_to_mac_addresses(
            session, [request.camera_mac_address], access
        ):
            raise HTTPException(
                status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
                detail="User does not have access to the camera",
            )

        try:
            await orm.AccessPoint.unassign_camera(
                session=session,
                ap_identifier=ap_models.AccessPointIdentifier(
                    id=request.access_point_id, vendor=request.vendor
                ),
                camera_mac_address=request.camera_mac_address,
            )
        except ap_models.AccessPointError as ex:
            raise HTTPException(
                status_code=fastapi.status.HTTP_404_NOT_FOUND, detail=str(ex)
            )


@access_control_router.post("/list_events")
async def list_events(
    request: models.ListAccessPointEventsRequest,
    brivo_client: BrivoClient = Depends(get_brivo_client),
    alta_client: AltaClient = Depends(get_alta_client),
    db: database.Database = Depends(get_backend_database),
    value_store: ValueStore = Depends(get_value_store),
    app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
) -> list[models.AccessPointEventResponse]:
    async with db.tenant_session() as session:
        has_brivo = await orm.BrivoIntegration.has_brivo_integration(session)
        has_alta = await orm.AltaIntegration.has_alta_integration(session)

    if has_brivo:
        try:
            brivo_events = await brivo_utils.list_brivo_events(
                start_time=request.start_time,
                end_time=request.end_time,
                brivo_client=brivo_client,
                tenant=app_user.tenant,
                db=db,
                value_store=value_store,
            )
        except BrivoError as e:
            brivo_events = []
            logger.error(f"Failed to list Brivo Access Control Events. {e}")
    else:
        brivo_events = []

    if has_alta:
        try:
            alta_events = await alta_utils.list_alta_events(
                start_time=request.start_time,
                end_time=request.end_time,
                alta_client=alta_client,
                db=db,
            )
        except AltaError as e:
            alta_events = []
            logger.error(f"Failed to list Alta Access Control Events. {e}")
    else:
        alta_events = []

    return sorted(
        brivo_events + alta_events, key=lambda event: event.time, reverse=True
    )


@access_control_router.post("/set_favorite_camera")
async def set_favorite_camera(
    request: models.SetFavoriteCameraRequest,
    db: database.Database = Depends(get_backend_database),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    _app_user: auth_models.AppUser = Depends(auth.admin_user_role_guard),
) -> None:
    async with db.tenant_session() as session:
        if not await orm.Camera.user_has_access_to_mac_addresses(
            session, [request.camera_mac_address], access
        ):
            raise HTTPException(
                status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
                detail="User does not have access to the camera",
            )

        try:
            await orm.AccessPoint.set_favorite_camera(
                session=session,
                ap_identifier=ap_models.AccessPointIdentifier(
                    id=request.access_point_id, vendor=request.vendor
                ),
                camera_mac_address=request.camera_mac_address,
            )
        except ap_models.AccessPointError as ex:
            raise HTTPException(
                status_code=fastapi.status.HTTP_404_NOT_FOUND, detail=str(ex)
            )
