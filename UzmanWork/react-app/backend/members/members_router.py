import logging

import fastapi
import pydantic

from backend import (
    auth,
    auth0_api,
    auth_models,
    dependencies,
    email_sending,
    envs,
    logging_config,
)
from backend.access_logs.constants import UserActions
from backend.access_logs.utils import AccessLogger
from backend.auth0_api.auth0_user import CoramUserOrgUpdateData
from backend.fastapi_utils import WithResponseExcludeNone
from backend.members import member_models
from backend.members.errors import MemberError
from backend.members.utils import handle_already_existing_user, is_coram_employee_email
from backend.value_store import ValueStore, get_user_last_activity_key

members_router = WithResponseExcludeNone(
    fastapi.APIRouter(
        prefix="/members",
        tags=["members"],
        generate_unique_id_function=lambda route: route.name,
    )
)

logger = logging.getLogger(logging_config.LOGGER_NAME)

not_authorized_exception = fastapi.HTTPException(
    status_code=fastapi.status.HTTP_403_FORBIDDEN, detail="Insufficient permissions"
)


async def get_user_in_org(
    auth_api: auth0_api.Auth0API, user_id: str, tenant: str
) -> auth0_api.Auth0User:
    user = await auth_api.get_user(user_id)
    if tenant not in user.app_metadata.organization_ids:
        raise not_authorized_exception
    return user


@members_router.get("/list")
async def get_members_list(
    auth_api: auth0_api.Auth0API = fastapi.Depends(dependencies.get_auth_api),
    app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    value_store: ValueStore = fastapi.Depends(dependencies.get_value_store),
) -> list[member_models.MemberModel]:
    org_users = await auth_api.get_org_users(app_user.tenant)
    last_active_dict = await value_store.get_multiple_timestamps(
        [get_user_last_activity_key(user.email) for user in org_users]
    )
    for user in org_users:
        user.last_login = last_active_dict.get(get_user_last_activity_key(user.email))
    return [
        member_models.MemberModel.from_auth0_user(user)
        for user in org_users
        if not is_coram_employee_email(pydantic.EmailStr(user.email))
        and user.app_metadata.role_assignment != auth0_api.UserRole.SUPPORT
    ]


@members_router.post("/create")
async def create_member(
    create_body: member_models.CreateMemberBody,
    auth_api: auth0_api.Auth0API = fastapi.Depends(dependencies.get_auth_api),
    app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    email_client: email_sending.EmailClient = fastapi.Depends(
        dependencies.get_email_client
    ),
    backend_envs: envs.BackendEnvs = fastapi.Depends(dependencies.get_backend_envs),
    _access_logger: None = fastapi.Depends(
        AccessLogger(UserActions.CREATED_NEW_MEMBER, ["email", "role"])
    ),
) -> None:
    try:
        if is_coram_employee_email(create_body.email):
            await auth_api.add_tenant_to_coram_user_by_email(
                CoramUserOrgUpdateData(tenant=app_user.tenant, email=create_body.email)
            )
            return
    except auth0_api.UserDoesNotExistError:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=f"Coram Employee with {create_body.email} email does not exist",
        )

    try:
        user = await auth_api.create_user_in_org(
            tenant=app_user.tenant,
            email=create_body.email,
            name=create_body.user_name,
            role=create_body.role,
            access_restrictions=create_body.access_restrictions,
        )
    except auth0_api.UserAlreadyExistsError:
        try:
            user = await handle_already_existing_user(
                user_email=create_body.email,
                role=create_body.role,
                access_restrictions=create_body.access_restrictions,
                auth_api=auth_api,
                tenant=app_user.tenant,
            )
        except MemberError as exc:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_409_CONFLICT, detail=str(exc)
            )

    try:
        await email_sending.send_welcome_email(
            email_client,
            user_email=user.email,
            user_name=user.name,
            web_app_url=backend_envs.web_app_url,
        )
    except email_sending.EmailException as exc:
        logger.error(f"Failed to send a welcome email to {user.email}: {exc}")


@members_router.post("/update_user_name")
async def update_user_name(
    update_body: member_models.UpdateUserNameBody,
    auth_api: auth0_api.Auth0API = fastapi.Depends(dependencies.get_auth_api),
    app_user: auth_models.AppUser = fastapi.Depends(auth.live_only_user_role_guard),
    _access_logger: None = fastapi.Depends(
        AccessLogger(UserActions.UPDATED_A_MEMBERS_NAME, ["user_name"])
    ),
) -> None:
    if update_body.user_id != app_user.user_id:
        raise not_authorized_exception

    await auth_api.update_user_name(update_body.user_id, update_body.user_name)


@members_router.post("/update_user_role")
async def update_user_role(
    update_body: member_models.UpdateUserRoleBody,
    auth_api: auth0_api.Auth0API = fastapi.Depends(dependencies.get_auth_api),
    app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    _access_logger: None = fastapi.Depends(
        AccessLogger(UserActions.UPDATED_A_MEMBERS_ROLE, ["role"])
    ),
) -> None:
    user = await get_user_in_org(auth_api, update_body.user_id, app_user.tenant)
    if (
        user.app_metadata.role_assignment >= auth0_api.UserRole.ADMIN
        and update_body.role < auth0_api.UserRole.ADMIN
    ):
        # Ensure at least one admin remains in the org
        org_users = await auth_api.get_org_users(app_user.tenant)
        if (
            len(
                [
                    user
                    for user in org_users
                    if user.app_metadata.role_assignment >= auth0_api.UserRole.ADMIN
                ]
            )
            == 1
        ):
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove the last admin",
            )
    await auth_api.update_user_role_assignment(user.user_id, update_body.role)


@members_router.post("/update_user_access_restrictions")
async def update_user_access_restrictions(
    update_body: member_models.UpdateUserAccessRestrictionsBody,
    auth_api: auth0_api.Auth0API = fastapi.Depends(dependencies.get_auth_api),
    app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    _access_logger: None = fastapi.Depends(
        AccessLogger(user_action=UserActions.UPDATED_A_MEMBERS_ACCESS_RESTRICTIONS)
    ),
) -> None:
    user = await get_user_in_org(auth_api, update_body.user_id, app_user.tenant)
    await auth_api.update_user_access_restrictions(
        user_id=user.user_id, access_restrictions=update_body.access_restrictions
    )


@members_router.delete("/delete")
async def delete_member(
    delete_body: member_models.DeleteMemberBody,
    auth_api: auth0_api.Auth0API = fastapi.Depends(dependencies.get_auth_api),
    app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    _access_logger: None = fastapi.Depends(
        AccessLogger(user_action=UserActions.DELETED_A_MEMBER)
    ),
) -> None:
    user = await get_user_in_org(auth_api, delete_body.user_id, app_user.tenant)
    await auth_api.update_user_organizations(
        user.user_id,
        [org for org in user.app_metadata.organization_ids if org != app_user.tenant],
    )


@members_router.delete("/permanently_delete_own_user")
async def permanently_delete_own_user(
    auth_api: auth0_api.Auth0API = fastapi.Depends(dependencies.get_auth_api),
    app_user: auth_models.AppUser = fastapi.Depends(
        auth.no_role_user_no_tenant_role_guard
    ),
    _access_logger: None = fastapi.Depends(
        AccessLogger(user_action=UserActions.DELETED_OWN_USER)
    ),
) -> None:
    await auth_api.delete_user(app_user.user_id)
