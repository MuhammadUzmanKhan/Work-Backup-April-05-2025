import logging

import fastapi

from backend import auth, auth0_api, auth_models, dependencies, logging_config
from backend.access_logs.constants import UserActions
from backend.access_logs.utils import AccessLogger
from backend.database import database, models, orm
from backend.fastapi_utils import WithResponseExcludeNone
from backend.organization_feature_flags.models import (
    ExposedOrgFlags,
    UpdateOrgFlagRequest,
)
from backend.organization_feature_flags.utils import (
    get_org_features_or_fail,
    get_org_or_fail,
    on_feature_disable,
    on_feature_enable,
)

org_flags_router = WithResponseExcludeNone(
    fastapi.APIRouter(
        prefix="/org_flags",
        tags=["org_flags"],
        generate_unique_id_function=lambda route: route.name,
    )
)
logger = logging.getLogger(logging_config.LOGGER_NAME)


@org_flags_router.get("/get_org_flag")
async def get_org_flag(
    org_flag: ExposedOrgFlags,
    _app_user: auth_models.AppUser = fastapi.Depends(auth.live_only_user_role_guard),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
) -> bool:
    async with db.tenant_session() as session:
        org_features = await get_org_features_or_fail(session)
    return models.FeatureFlags(org_flag.value) in org_features


@org_flags_router.post("/update_org_flag")
async def update_org_flag(
    request: UpdateOrgFlagRequest,
    _app_user: auth_models.AppUser = fastapi.Depends(auth.admin_user_role_guard),
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    auth_api: auth0_api.Auth0API = fastapi.Depends(dependencies.get_auth_api),
    _access_logger: None = fastapi.Depends(
        AccessLogger(UserActions.UPDATED_ORG_FLAG, ["flag_enum", "flag_value"])
    ),
) -> bool:
    async with db.tenant_session() as session:
        org = await get_org_or_fail(session)
        if request.flag_value:
            await orm.OrganizationFeature.new_organization_feature(
                session, models.FeatureFlags(request.flag_enum.value)
            )
            await on_feature_enable(
                org, models.FeatureFlags(request.flag_enum.value), auth_api
            )
        else:
            await orm.OrganizationFeature.delete_organization_feature(
                session, models.FeatureFlags(request.flag_enum.value)
            )
            await on_feature_disable(
                org, models.FeatureFlags(request.flag_enum.value), auth_api
            )

    return request.flag_value
