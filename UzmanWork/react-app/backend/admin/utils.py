from typing import Literal

import fastapi
from sqlalchemy.ext.asyncio import AsyncSession

from backend import auth, auth_models, dependencies
from backend.database import database, orm
from backend.database.models import FeatureFlags


async def check_administration_is_enabled_for_org_or_fail(
    session: AsyncSession, org_tenant: str
) -> None:
    is_admin_enabled_for_org = (
        await orm.Feature.system_is_feature_enabled_across_tenants(
            session,
            feature=FeatureFlags.GLOBAL_ADMINISTRATION_ENABLED,
            tenants=[org_tenant],
        )
    )
    if not is_admin_enabled_for_org:
        raise fastapi.HTTPException(
            status_code=403, detail="Feature not enabled for this tenant"
        )


async def administration_is_enabled_check(
    app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
) -> None:
    async with db.session() as session:
        await check_administration_is_enabled_for_org_or_fail(session, app_user.tenant)


async def check_user_is_device_manager_or_fail(
    app_user: auth_models.AppUser, device_managers_emails: list[str] | Literal["ALL"]
) -> None:
    if (
        device_managers_emails != "ALL"
        and app_user.user_email not in device_managers_emails
    ):
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_403_FORBIDDEN,
            detail="This opperation is only allowed for Device Managers.",
        )
