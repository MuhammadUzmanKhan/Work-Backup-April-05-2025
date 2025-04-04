import faulthandler
import logging.config
import os
import signal

from fastapi import APIRouter, Depends, FastAPI, staticfiles

from backend import (
    auth,
    auth_models,
    logging_config,
    members,
    organization_alert_subscribers,
)
from backend.access_control.router import access_control_router
from backend.admin.router import admin_router
from backend.archive.router import archive_router
from backend.camera.router import cameras_router
from backend.cameras_registration import cameras_registration_router
from backend.constants import STATIC_CLIPS_PATH
from backend.dashboard.router import dashboard_router
from backend.database import database, models, orm
from backend.database.organization_models import Organization
from backend.dependencies import (
    get_auth_api,
    get_backend_database,
    get_backend_envs,
    get_mq_connection,
    init_app,
    initialize_dependencies,
    wait_for_migrations,
)
from backend.devices.devices_router import devices_router
from backend.face.router import face_router
from backend.face_alert.router import face_alert_router
from backend.fastapi_utils import WithResponseExcludeNone
from backend.kinesis_api.router import kinesis_api_router, kinesis_api_router_public
from backend.kiosk.public_router import kiosk_public_router
from backend.kiosk.router import kiosk_router
from backend.license_plate.router import license_plate_router
from backend.license_plate_alert.router import license_plate_alert_router
from backend.middleware import (
    InstrumentationMiddleware,
    ResetAppUserMiddleware,
    register_frontend_cors,
)
from backend.models import AccessRestrictions, CameraGroupWithLocations, CameraResponse
from backend.monitor.router import monitor_router
from backend.multi_cam_tracking.router import journey_router
from backend.notification_groups.router import notification_group_router
from backend.organization_feature_flags.router import org_flags_router
from backend.organizations.organizations_router import organizations_router
from backend.perception.router import perception_router
from backend.retention_management.router import retention_management_router
from backend.sentry_instrumentation.utils import init_sentry
from backend.shared_video.router import shared_video_router, shared_video_router_public
from backend.tag.router import tags_router
from backend.text_search.router import text_search_router
from backend.thumbnail.router import thumbnail_router
from backend.user_alert.router import user_alert_router
from backend.user_wall.router import user_wall_router
from backend.versioning.router import versioning_router

logger = logging.getLogger(logging_config.LOGGER_NAME)
faulthandler.register(signal.SIGUSR2, all_threads=True)

app = FastAPI()
app.mount(
    "/static/clips",
    staticfiles.StaticFiles(directory=STATIC_CLIPS_PATH),
    name="static_clips",
)

client_router = WithResponseExcludeNone(
    APIRouter(generate_unique_id_function=lambda route: route.name)
)


class StartupException(Exception):
    pass


@app.on_event("startup")
async def startup_event() -> None:
    await initialize_dependencies()
    init_app(app)
    database = get_backend_database()
    await wait_for_migrations(database)


@app.on_event("shutdown")
async def shutdown_event() -> None:
    await get_mq_connection().close()
    await get_auth_api().auth0_client.close()


@client_router.get("/groups")
async def groups(
    _app_user: auth_models.AppUser = Depends(auth.live_only_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
) -> list[models.CameraGroup]:
    """Get the groups for which the user has access and optionally belong to an
    organization.

    :return: List of camera group objects.
    """
    async with db.tenant_session() as session:
        return await orm.CameraGroup.get_allowed_groups(session, access)


@client_router.get("/organizations")
async def organizations(
    app_user: auth_models.AppUserNoTenant = Depends(
        auth.live_only_user_no_tenant_role_guard
    ),
    db: database.Database = Depends(get_backend_database),
) -> list[Organization]:
    """Get the organizations which the logged-in user is allowed to see."""
    async with db.session() as session:
        return await orm.Organization.system_get_orgs(
            session, tenants=app_user.all_tenants
        )


@client_router.get("/groups_with_location")
async def groups_with_location(
    _app_user: auth_models.AppUser = Depends(auth.live_only_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
) -> list[CameraGroupWithLocations]:
    """Get the CameraGroups visible by the user together with set of locations
    where they are present.
    """
    async with db.tenant_session() as session:
        return await orm.CameraGroup.get_groups_with_location(
            session, access_restrictions=access
        )


@client_router.get("/locations")
async def locations(
    _app_user: auth_models.AppUser = Depends(auth.live_only_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
) -> list[models.Location]:
    async with db.tenant_session() as session:
        return await orm.Location.get_locations_info(session, access)


@client_router.get("/cameras", deprecated=True)
async def get_cameras(
    nvr_uuid: str | None = None,
    location_id: int | None = None,
    exclude_disabled: bool = False,
    app_user: auth_models.AppUser = Depends(auth.live_only_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
) -> list[CameraResponse]:
    """Retrieve cameras based on provided filters."""
    async with db.tenant_session() as session:
        return await orm.Camera.get_cameras(
            session,
            query_config=models.CamerasQueryConfig(
                nvr_uuids={nvr_uuid} if nvr_uuid is not None else None,
                location_ids={location_id} if location_id is not None else None,
                exclude_disabled=exclude_disabled,
            ),
            access_restrictions=access,
        )


@client_router.get("/features")
async def features(
    app_user: auth_models.AppUserNoTenant = Depends(
        auth.live_only_user_no_tenant_role_guard
    ),
    db: database.Database = Depends(get_backend_database),
) -> list[models.FeatureFlags]:
    async with db.session() as session:
        return await orm.Feature.system_get_enabled_features_across_tenants(
            session, app_user.all_tenants
        )


app.include_router(client_router)
app.include_router(devices_router)
app.include_router(perception_router)
app.include_router(kinesis_api_router)
app.include_router(kinesis_api_router_public)

app.include_router(members.members_router)
app.include_router(shared_video_router)
app.include_router(shared_video_router_public)
app.include_router(monitor_router)
app.include_router(thumbnail_router)
app.include_router(text_search_router)
app.include_router(journey_router)
app.include_router(user_alert_router)
app.include_router(user_wall_router)
app.include_router(organization_alert_subscribers.organization_alert_subscribers_router)
app.include_router(archive_router)
app.include_router(face_router)
app.include_router(face_alert_router)
app.include_router(license_plate_router)
app.include_router(license_plate_alert_router)
app.include_router(access_control_router)
app.include_router(org_flags_router)
app.include_router(organizations_router)
app.include_router(cameras_registration_router.router)
app.include_router(notification_group_router)
app.include_router(kiosk_router)
app.include_router(kiosk_public_router)
app.include_router(versioning_router)
app.include_router(dashboard_router)
app.include_router(retention_management_router)
app.include_router(cameras_router)
app.include_router(tags_router)
app.include_router(admin_router)

if os.environ.get("INITIALISE_MIDDLEWARE"):
    init_sentry(app)
    envs = get_backend_envs()
    origins = register_frontend_cors(
        app, [envs.domain] + envs.additional_cors_domains, [envs.frontend_exposed_port]
    )
    logger.info(f"Registered CORS origins: {origins}")

    app.add_middleware(ResetAppUserMiddleware)
    logger.info("Enabling Reset App User Middleware")

    if not envs.disable_instrumentation_middleware:
        app.add_middleware(InstrumentationMiddleware)
        logger.info("Registered Instrumentation Middleware")
