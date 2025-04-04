import dataclasses
import logging
from typing import Any

import fastapi
import jwt
from fastapi import security

from backend import dependencies, envs, logging_config
from backend.auth0_api import UserRole as UserRole
from backend.auth_context import set_app_user, set_edge_user
from backend.auth_models import (
    AppUser,
    AppUserFullInfo,
    AppUserNoTenant,
    AwsCognitoClient,
    EdgeUser,
    EdgeUserNoTenant,
)
from backend.database import database
from backend.database.orm.orm_nvr import NVR
from backend.instrumentation.context import get_instrumentation_from_context
from backend.models import AccessRestrictions
from backend.sync_utils import run_async
from backend.utils import AwareDatetime
from backend.value_store import ValueStore, get_user_last_activity_key

logger = logging.getLogger(logging_config.LOGGER_NAME)

_oauth_scheme = security.APIKeyHeader(scheme_name="bearer", name="Authorization")

_org_tenant = security.APIKeyHeader(scheme_name="org tenant", name="x-coram-org-tenant")


# NOTE(@lberg): this is async because it might need to fetch the jwk set
# from the auth provider
async def _get_signing_key(*, token: str, jwk_client: jwt.PyJWKClient) -> jwt.PyJWK:
    return await run_async(lambda: jwk_client.get_signing_key_from_jwt(token))


async def _decode_token_auth0(
    *, token: str, jwk_client: jwt.PyJWKClient, jwt_issuer: str, audience: str
) -> dict[str, Any] | None:
    try:
        token = token.removeprefix("Bearer ")
        signing_key = await _get_signing_key(token=token, jwk_client=jwk_client)
        res: dict[str, Any] = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            require=["iss", "exp", "iat", "nbf", "userUuid", "authorization"],
            audience=audience,
            issuer=jwt_issuer,
        )
    except jwt.exceptions.PyJWTError as ex:
        logger.error(f"Failed to decode token. {ex}")
        return None
    return res


async def _decode_token_aws_cognito(
    *, token: str, aws_cognito_client: AwsCognitoClient
) -> dict[str, Any] | None:
    """Decode a token from AWS Cognito using the pkey in the client."""
    try:
        token = token.removeprefix("Bearer ")
        signing_key = await _get_signing_key(
            token=token, jwk_client=aws_cognito_client.jwk_client
        )
        # decode and verify the signature
        claims: dict[str, Any] = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            require=["iss", "exp", "iat", "client_id", "scope"],
        )
        # verify the scope
        if claims["scope"] != aws_cognito_client.scope:
            logger.error("Scope not valid.")
            return None
        return claims

    except jwt.exceptions.PyJWTError as ex:
        logger.error(f"Failed to decode token. {ex}")
        return None


async def _get_org_user_from_token(
    *,
    token: str,
    jwk_client: jwt.PyJWKClient,
    jwt_org_key: str,
    jwt_role_key: str,
    jwt_access_restrictions_key: str,
    jwt_issuer: str,
    audience: str,
) -> AppUserFullInfo | None:
    res = await _decode_token_auth0(
        token=token, jwk_client=jwk_client, jwt_issuer=jwt_issuer, audience=audience
    )
    if res is None:
        return None

    tenants = res.get(jwt_org_key) or []
    user_id = res.get("sub")
    # TODO(@lberg): this is not type checked?
    email = res.get("email")
    role = UserRole(res.get(jwt_role_key) or "none")
    access_restrictions = res.get(jwt_access_restrictions_key, AccessRestrictions())

    if user_id is None:
        logger.error("User not authorized for organization.")
        return None

    return AppUserFullInfo(
        user_id=user_id,
        user_email=email,
        role=role,
        access_restrictions=access_restrictions,
        all_tenants=tenants,
    )


async def get_edge_user_from_aws_cognito_token(
    *, token: str, aws_cognito_client: AwsCognitoClient
) -> EdgeUserNoTenant | None:
    res = await _decode_token_aws_cognito(
        token=token, aws_cognito_client=aws_cognito_client
    )
    if res is None:
        return None
    aws_cognito_client_id = res.get("client_id")
    if aws_cognito_client_id is None:
        logger.error("Cognito pool app id not found in token.")
        return None

    nvr_uuid = await aws_cognito_client.retrieve_nvr_uuid(aws_cognito_client_id)
    if nvr_uuid is None:
        logger.error("Cognito pool app name (nvr_uuid) not found.")
        return None

    return EdgeUserNoTenant(user_uuid=nvr_uuid)


async def _get_user(
    token: str = fastapi.Depends(_oauth_scheme),
    jwk_client: jwt.PyJWKClient = fastapi.Depends(dependencies.get_jwk_client),
    env: envs.BackendEnvs = fastapi.Depends(dependencies.get_backend_envs),
) -> AppUserFullInfo:
    user = await _get_org_user_from_token(
        token=token,
        jwk_client=jwk_client,
        jwt_org_key=env.auth0_jwt_org_key,
        jwt_role_key=env.auth0_jwt_role_key,
        jwt_access_restrictions_key=env.auth0_jwt_access_restrictions_key,
        jwt_issuer=env.auth0_jwt_issuer,
        audience=env.auth0_web_audience,
    )
    if user is None:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )
    return user


def get_user_with_org(
    org_tenant: str = fastapi.Depends(_org_tenant),
    user: AppUserFullInfo = fastapi.Depends(_get_user),
) -> AppUser:
    if org_tenant not in user.all_tenants:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )
    return AppUser(
        tenant=org_tenant,
        user_id=user.user_id,
        user_email=user.user_email,
        role=user.role,
    )


async def get_edge_user_without_tenant(
    token: str = fastapi.Depends(_oauth_scheme),
    aws_cognito_client: AwsCognitoClient = fastapi.Depends(
        dependencies.get_aws_cognito_client
    ),
) -> EdgeUserNoTenant:
    user = await get_edge_user_from_aws_cognito_token(
        token=token, aws_cognito_client=aws_cognito_client
    )
    if user is None:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )

    return EdgeUserNoTenant(user_uuid=user.user_uuid)


async def record_activity(
    request: fastapi.Request,
    user: AppUserFullInfo = fastapi.Depends(_get_user),
    value_store: ValueStore = fastapi.Depends(dependencies.get_value_store),
) -> None:
    if "request_live" in request.url.path:
        return
    await value_store.set_timestamp(
        get_user_last_activity_key(user.user_email), time=AwareDatetime.utcnow()
    )


class RoleGuard:
    pass


@dataclasses.dataclass(frozen=True)
class WebUserRoleGuard(RoleGuard):
    required_role: UserRole

    async def __call__(
        self,
        user: AppUser = fastapi.Depends(get_user_with_org),
        _activity: None = fastapi.Depends(record_activity),
    ) -> AppUser:
        if user.role < self.required_role:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        await set_app_user(user)
        if serializer := await get_instrumentation_from_context():
            serializer.add_tag("user_email", user.user_email)
            serializer.add_tag("tenant", user.tenant)

        return user


@dataclasses.dataclass(frozen=True)
class WebUserNoTenantRoleGuard(RoleGuard):
    required_role: UserRole

    def __call__(
        self,
        user: AppUserFullInfo = fastapi.Depends(_get_user),
        _activity: None = fastapi.Depends(record_activity),
    ) -> AppUserNoTenant:
        if user.role < self.required_role:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return AppUserNoTenant(**user.dict())


class EdgeUserGuard(RoleGuard):
    async def __call__(
        self,
        user_without_tenant: EdgeUserNoTenant = fastapi.Depends(
            get_edge_user_without_tenant
        ),
        db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    ) -> EdgeUser:
        nvr_uuid = user_without_tenant.user_uuid
        serializer = await get_instrumentation_from_context()
        if serializer:
            serializer.add_tag("nvr_uuid", nvr_uuid)

        async with db.session() as session:
            nvr_org = await NVR.system_get_owner(session, nvr_uuid)
        if nvr_org is None:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_403_FORBIDDEN,
                detail=f"{nvr_uuid=} not found or not assigned to an organization.",
            )

        if serializer:
            serializer.add_tag("tenant", nvr_org.tenant)

        user = EdgeUser(user_uuid=user_without_tenant.user_uuid, tenant=nvr_org.tenant)
        await set_edge_user(user)
        return user


class EdgeUserNoTenantGuard(RoleGuard):
    async def __call__(
        self, user: EdgeUserNoTenant = fastapi.Depends(get_edge_user_without_tenant)
    ) -> EdgeUserNoTenant:
        if serializer := await get_instrumentation_from_context():
            serializer.add_tag("nvr_uuid", user.user_uuid)

        return user


no_role_user_no_tenant_role_guard = WebUserNoTenantRoleGuard(UserRole.NONE)
live_only_user_no_tenant_role_guard = WebUserNoTenantRoleGuard(UserRole.LIVE_ONLY)
live_only_user_role_guard = WebUserRoleGuard(UserRole.LIVE_ONLY)
limited_user_role_guard = WebUserRoleGuard(UserRole.LIMITED)
regular_user_role_guard = WebUserRoleGuard(UserRole.REGULAR)
admin_user_role_guard = WebUserRoleGuard(UserRole.ADMIN)
edge_user_role_guard = EdgeUserGuard()
edge_user_no_tenant_role_guard = EdgeUserNoTenantGuard()


def get_user_access_restrictions(
    user: AppUserFullInfo = fastapi.Depends(_get_user),
) -> AccessRestrictions:
    if user.role == UserRole.ADMIN:
        return AccessRestrictions()
    return user.access_restrictions
