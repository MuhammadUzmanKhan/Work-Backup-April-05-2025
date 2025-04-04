import asyncio
import logging

import fastapi
from pydantic import EmailStr

from backend import auth, auth0_api, auth_models, dependencies, logging_config, utils
from backend.access_logs.constants import UserActions
from backend.access_logs.utils import AccessLogger
from backend.auth0_api.auth0_api import UserDoesNotExistError
from backend.constants import SUPPORT_TEAM_EMAILS
from backend.database import database, models, orm
from backend.database.organization_models import (
    OrganizationCreate,
    OrgCamerasAudioSettings,
    OrgCamerasWebRTCSettings,
)
from backend.fastapi_utils import WithResponseExcludeNone
from backend.members.utils import is_coram_employee_email
from backend.organization_feature_flags.utils import (
    check_user_tenant,
    get_org_features_or_fail,
)
from backend.organizations.organizations_models import (
    AccessLogsRequest,
    AccessLogsResponse,
    CreateOrganizationRequest,
    NetworkScanSettingsResponse,
    NetworkScanSettingsUpdateRequest,
    OrgCamerasAudioSettingsUpdateRequest,
    OrgCamerasWebRTCSettingsUpdateRequest,
    OrgNumberLicensesCamerasResponse,
    OrgNumberLicensesCamerasUpdateRequest,
    UpdateInactiveUserLogoutRequest,
)
from backend.organizations.utils import (
    toggle_audio_org_cameras_or_fail,
    toggle_webrtc_org_cameras_or_fail,
)

logger = logging.getLogger(logging_config.LOGGER_NAME)

organizations_router = WithResponseExcludeNone(
    fastapi.APIRouter(
        prefix="/organizations",
        tags=["organizations"],
        generate_unique_id_function=lambda route: route.name,
    )
)


@organizations_router.post("/create_organization")
async def create_organization(
    create_organization_request: CreateOrganizationRequest,
    _app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    auth_api: auth0_api.Auth0API = fastapi.Depends(dependencies.get_auth_api),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
) -> int:
    """Create a new organization and initializes it with users provided in the
        member_emails field.
    :param name: Name of the new org.
    :return: id of the newly created instance.
    """
    try:
        users_for_new_org = await asyncio.gather(
            *[auth_api.get_user_by_email(email) for email in SUPPORT_TEAM_EMAILS]
        )

    except UserDoesNotExistError:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="One or more emails are not valid",
        )

    async with db.session() as session:
        existing_orgs = await orm.Organization.system_get_orgs(session)

        if create_organization_request.name in [org.name for org in existing_orgs]:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail="Organization already exists",
            )
        new_tenant = utils.generate_random_organization_tenant(
            [org.tenant for org in existing_orgs]
        )

        organization_data = OrganizationCreate(
            name=create_organization_request.name, tenant=new_tenant
        )
        org = await orm.Organization.system_new_organization(session, organization_data)

    for user in users_for_new_org:
        await auth_api.update_user_organizations(
            user.user_id,
            [org for org in user.app_metadata.organization_ids] + [new_tenant],
        )
    return org.id


@organizations_router.post("/update_low_res_bitrate")
async def update_low_res_bitrate(
    request: models.UpdateOrgLowResBitrateRequest,
    app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    _access_logger: None = fastapi.Depends(
        AccessLogger(UserActions.UPDATED_LOW_RES_BITRATE, ["low_res_bitrate_kbps"])
    ),
) -> None:
    """Update retention days for always-on streams of the specific org"""
    check_user_tenant(app_user.tenant, request.tenant)

    async with db.tenant_session() as session:
        ret = await orm.Organization.update_low_res_bitrate(
            session=session, low_res_bitrate_kbps=request.low_res_bitrate_kbps
        )
        if not ret:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Failed to update low res bitrate for org [id={request.tenant}]!"
                ),
            )


@organizations_router.post("/update_inactive_user_logout")
async def update_inactive_user_logout(
    request: UpdateInactiveUserLogoutRequest,
    _app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    _access_logger: None = fastapi.Depends(
        AccessLogger(
            UserActions.UPDATED_INACTIVE_USER_LOGOUT, ["inactive_user_logout_enabled"]
        )
    ),
) -> None:
    async with db.tenant_session() as session:
        await orm.Organization.update_inactive_user_logout(
            session, inactive_user_logout_enabled=request.inactive_user_logout_enabled
        )
    return None


@organizations_router.post("/access_logs")
async def get_access_logs(
    access_logs_request: AccessLogsRequest,
    _app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
) -> list[AccessLogsResponse]:
    async with db.tenant_session() as session:
        access_logs = await orm.AccessLog.get_access_logs(
            session, access_logs_request.start_time, access_logs_request.end_time
        )
        org_features = await get_org_features_or_fail(session)

    coram_user_logs_enabled = (
        models.FeatureFlags.SHOW_CORAM_USERS_IN_ACCESS_LOGS in org_features
    )

    if not coram_user_logs_enabled:
        access_logs = [
            log
            for log in access_logs
            if not is_coram_employee_email(EmailStr(log.user_email))
        ]

    return [
        AccessLogsResponse(
            **dict((i, log.dict()[i]) for i in log.dict() if i != "action"),
            action=str(log.action),
        )
        for log in access_logs
    ]


@organizations_router.post("/update_audio_settings")
async def update_audio_settings(
    update_request: OrgCamerasAudioSettingsUpdateRequest,
    app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    _access_logger: None = fastapi.Depends(
        AccessLogger(UserActions.UPDATED_ORG_AUDIO_SETTINGS, ["audio_settings"])
    ),
) -> None:
    async with db.tenant_session() as session:
        ret = await orm.Organization.update_cameras_audio_settings(
            session=session, cameras_audio_settings=update_request.audio_settings
        )
        if not ret:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail="Failed to update organization audio settings",
            )
        # based on the enum value, we might have to update all cameras
        match update_request.audio_settings:
            case OrgCamerasAudioSettings.MANUAL:
                pass
            case OrgCamerasAudioSettings.ENABLED:
                await toggle_audio_org_cameras_or_fail(db, enable=True)
            case OrgCamerasAudioSettings.DISABLED:
                await toggle_audio_org_cameras_or_fail(db, enable=False)


@organizations_router.post("/update_webrtc_settings")
async def update_webrtc_settings(
    update_request: OrgCamerasWebRTCSettingsUpdateRequest,
    _app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    _access_logger: None = fastapi.Depends(
        AccessLogger(UserActions.UPDATED_ORG_WEBRTC_SETTINGS, ["webrtc_settings"])
    ),
) -> None:
    async with db.tenant_session() as session:
        ret = await orm.Organization.update_cameras_webrtc_settings(
            session=session, cameras_webrtc_settings=update_request.webrtc_settings
        )
        if not ret:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail="Failed to update organization audio settings",
            )
        # based on the enum value, we might have to update all cameras
        match update_request.webrtc_settings:
            case OrgCamerasWebRTCSettings.MANUAL:
                pass
            case OrgCamerasWebRTCSettings.ENABLED:
                await toggle_webrtc_org_cameras_or_fail(db, enable=True)
            case OrgCamerasWebRTCSettings.DISABLED:
                await toggle_webrtc_org_cameras_or_fail(db, enable=False)


@organizations_router.post("/update_number_licensed_cameras")
async def update_number_licensed_cameras(
    update_request: OrgNumberLicensesCamerasUpdateRequest,
    app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    _access_logger: None = fastapi.Depends(
        AccessLogger(
            UserActions.UPDATED_NUMBER_LICENSE_CAMERAS, ["number_licensed_cameras"]
        )
    ),
) -> None:
    if not is_coram_employee_email(EmailStr(app_user.user_email)):
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_403_FORBIDDEN,
            detail="This action is only allowed for Coram employees.",
        )

    async with db.tenant_session() as session:
        ret = await orm.Organization.update_number_licensed_cameras(
            session=session,
            number_licensed_cameras=update_request.number_licensed_cameras,
        )
        if not ret:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail="Failed to update number of licensed cameras",
            )


@organizations_router.get("/retrieve_number_licensed_cameras")
async def retrieve_number_licensed_cameras(
    app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
) -> OrgNumberLicensesCamerasResponse:
    if not is_coram_employee_email(EmailStr(app_user.user_email)):
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_403_FORBIDDEN,
            detail="This action is only allowed for Coram employees.",
        )

    async with db.tenant_session() as session:
        number_licensed_cameras = (
            await orm.Organization.get_org_number_licensed_cameras(session)
        )
    return OrgNumberLicensesCamerasResponse(
        number_licensed_cameras=number_licensed_cameras
    )


@organizations_router.post("/update_network_scan_settings")
async def update_network_scan_settings(
    update_request: NetworkScanSettingsUpdateRequest,
    app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    _access_logger: None = fastapi.Depends(
        AccessLogger(UserActions.UPDATED_NETWORK_SCAN_SETTINGS, ["mode"])
    ),
) -> None:
    async with db.tenant_session() as session:
        ret = await orm.Organization.update_network_scan_settings(
            session=session, network_scan_settings=update_request.network_scan_settings
        )
        if not ret:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail="Failed to update the network scan settings",
            )


@organizations_router.get("/retrieve_network_scan_settings")
async def retrieve_network_scan_settings(
    app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
) -> NetworkScanSettingsResponse:
    async with db.tenant_session() as session:
        network_scan_settings = await orm.Organization.get_network_scan_settings(
            session
        )
    if network_scan_settings is None:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="Network scan settings not found",
        )
    return NetworkScanSettingsResponse(network_scan_settings=network_scan_settings)
