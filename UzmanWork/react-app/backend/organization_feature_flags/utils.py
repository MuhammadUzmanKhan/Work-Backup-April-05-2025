import asyncio
import logging

import fastapi
from pydantic import EmailStr

from backend import auth0_api, logging_config
from backend.constants import SUPPORT_TEAM_EMAILS
from backend.database import models, orm
from backend.database.organization_models import Organization
from backend.database.session import TenantAwareAsyncSession
from backend.members.utils import is_coram_employee_email

logger = logging.getLogger(logging_config.LOGGER_NAME)


async def get_org_or_fail(session: TenantAwareAsyncSession) -> Organization:
    org = await orm.Organization.get_org(session)
    if org is None:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    return org


def check_user_tenant(user_tenant: str, request_tenant: str) -> None:
    if user_tenant != request_tenant:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_403_FORBIDDEN,
            detail="User does not have access to this organization",
        )


async def get_org_features_or_fail(
    session: TenantAwareAsyncSession,
) -> list[models.FeatureFlags]:
    return await orm.OrganizationFeature.get_organization_features(session)


async def remove_org_from_coram_users(
    org: Organization, auth_api: auth0_api.Auth0API
) -> None:
    org_users = await auth_api.get_org_users(org.tenant)
    users_to_remove_org_from = []
    for user in org_users:
        if is_coram_employee_email(EmailStr(user.email)):
            users_to_remove_org_from.append(user)

    await asyncio.gather(
        *[
            auth_api.update_user_organizations(
                user.user_id,
                [
                    tenant
                    for tenant in user.app_metadata.organization_ids
                    if tenant != org.tenant
                ],
            )
            for user in users_to_remove_org_from
        ]
    )


async def on_feature_enable(
    org: Organization, feature: models.FeatureFlags, auth_api: auth0_api.Auth0API
) -> None:
    if feature == models.FeatureFlags.SUPPORT_TEAM_DISABLED:
        await remove_org_from_coram_users(org, auth_api)


async def on_feature_disable(
    org: Organization, feature: models.FeatureFlags, auth_api: auth0_api.Auth0API
) -> None:
    if feature == models.FeatureFlags.SUPPORT_TEAM_DISABLED:
        results = await asyncio.gather(
            *[
                auth_api.add_org_to_user_by_email(org, email)
                for email in SUPPORT_TEAM_EMAILS
            ],
            return_exceptions=True,
        )
        for result in results:
            if isinstance(result, Exception):
                logger.error(
                    f"Exception while adding support group members to org : {result}"
                )
