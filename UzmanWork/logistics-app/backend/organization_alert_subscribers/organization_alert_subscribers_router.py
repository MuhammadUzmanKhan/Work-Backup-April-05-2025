import logging

import fastapi
import pydantic

from backend import auth, auth_models, dependencies, logging_config
from backend.access_logs.constants import UserActions
from backend.access_logs.utils import AccessLogger
from backend.database import database, models, orm
from backend.fastapi_utils import WithResponseExcludeNone

organization_alert_subscribers_router = WithResponseExcludeNone(
    fastapi.APIRouter(
        prefix="/organization_alert_subscribers",
        tags=["members"],
        dependencies=[fastapi.Depends(auth.admin_user_role_guard)],
        generate_unique_id_function=lambda route: route.name,
    )
)
logger = logging.getLogger(logging_config.LOGGER_NAME)


class OrganizationAlertSubscriberBody(pydantic.BaseModel):
    alert_type: models.SubscriberAlertType
    alert_target: str


@organization_alert_subscribers_router.post("/add")
async def add_organization_alert_subscriber(
    body: OrganizationAlertSubscriberBody,
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    _app_user: auth_models.AppUser = fastapi.Depends(auth.limited_user_role_guard),
    _access_logger: None = fastapi.Depends(
        AccessLogger(
            UserActions.ADDED_A_SUBSCRIBER_TO_AN_ORGANIZATION_ALERT,
            ["alert_type", "alert_target"],
        )
    ),
) -> None:
    async with db.tenant_session() as session:
        await orm.OrganizationAlertSubscriber.add_organization_alert_subscriber(
            session, body.alert_type, body.alert_target
        )


@organization_alert_subscribers_router.delete("/remove")
async def remove_organization_alert_subscriber(
    body: OrganizationAlertSubscriberBody,
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    _app_user: auth_models.AppUser = fastapi.Depends(auth.limited_user_role_guard),
    _access_logger: None = fastapi.Depends(
        AccessLogger(
            UserActions.REMOVED_A_SUBSCRIBER_FROM_AN_ORGANIZATION_ALERT,
            ["alert_type", "alert_target"],
        )
    ),
) -> None:
    async with db.tenant_session() as session:
        await orm.OrganizationAlertSubscriber.remove_organization_alert_subscriber(
            session, body.alert_type, body.alert_target
        )


@organization_alert_subscribers_router.get("/list")
async def list_alert_subscribers(
    db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    _app_user: auth_models.AppUser = fastapi.Depends(auth.limited_user_role_guard),
) -> list[models.AlertSubscriber]:
    async with db.tenant_session() as session:
        return await orm.OrganizationAlertSubscriber.get_organization_alert_subscribers(
            session
        )
