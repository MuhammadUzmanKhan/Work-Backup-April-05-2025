import fastapi
from fastapi import APIRouter, Depends

from backend import auth, auth_models
from backend.access_logs.constants import UserActions
from backend.access_logs.utils import AccessLogger
from backend.database import database, models, orm
from backend.database.orm import orm_user_alert
from backend.dependencies import get_backend_database
from backend.fastapi_utils import WithResponseExcludeNone

user_alert_router = WithResponseExcludeNone(
    APIRouter(
        prefix="/user_alerts",
        dependencies=[Depends(auth.limited_user_role_guard)],
        tags=["user_alerts"],
        generate_unique_id_function=lambda route: route.name,
    )
)


@user_alert_router.post("/update_setting_name")
async def update_user_alert_setting_name(
    setting_id: int,
    setting_name: str,
    _app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    _access_logger: None = Depends(
        AccessLogger(
            user_action=UserActions.UPDATED_A_USER_ALERT_SETTING_NAME,
            extra_args=["setting_name"],
        )
    ),
) -> None:
    """Update existing alert setting name.

    :param settings_id: the settings for the user alert setting to delete.
    :param app_user: The user making the request.
    :param db: DB instance, defaults to Depends(get_backend_database)
    :return: ID of the new user alert.
    """
    async with db.tenant_session() as session:
        try:
            await orm.UserAlertSetting.update_alert_setting_name(
                session, setting_id, setting_name
            )
        except orm_user_alert.UserAlertException:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST, detail="No permission."
            )

    return None


@user_alert_router.post("/delete")
async def delete_user_alert(
    settings_id: list[int],
    _app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    _access_logger: None = Depends(
        AccessLogger(user_action=UserActions.DELETED_A_USER_ALERT_SETTING)
    ),
) -> None:
    """Delete the user alert settings if id is specified in settings_id.

    :param settings_id: the settings for the user alert setting to delete.
    :param app_user: The user making the request.
    :param db: DB instance, defaults to Depends(get_backend_database)
    :return: ID of the new user alert.
    """
    async with db.tenant_session() as session:
        # to delete a setting id, we need to delete all the alerts associated with it
        await orm.UserAlert.delete_alerts_for_setting_ids(session, settings_id)
        await orm.UserAlertSetting.delete_alert_settings(session, settings_id)
    return None


@user_alert_router.post("/create")
async def create_user_alert(
    settings: models.UserAlertSettingCreate,
    _app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    _access_logger: None = Depends(
        AccessLogger(user_action=UserActions.CREATED_A_NEW_USER_ALERT)
    ),
) -> int:
    """Create a new user alert.

    :param settings: the settings for the new user alert.
    :param app_user: The user making the request.
    :param db: DB instance, defaults to Depends(get_backend_database)
    :return: ID of the new user alert.
    """
    async with db.tenant_session() as session:
        try:
            alert_setting = await orm.UserAlertSetting.new_alert_setting(
                session, settings
            )
        except orm_user_alert.UserAlertException:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST, detail="No permission."
            )

    return alert_setting.id


@user_alert_router.post("/update")
async def update_user_alert(
    settings: models.UserAlertSetting,
    _app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    _access_logger: None = Depends(
        AccessLogger(user_action=UserActions.UPDATED_AN_EXISTING_USER_ALERT)
    ),
) -> None:
    """Update an existing user alert."""
    async with db.tenant_session() as session:
        try:
            await orm.UserAlertSetting.update_alert_setting(session, settings)
        except orm_user_alert.UserAlertException:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST, detail="No permission."
            )


@user_alert_router.get("/alert_settings")
async def get_alerts(
    camera_mac_address: str | None = None,
    _app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    db: database.Database = Depends(get_backend_database),
) -> list[models.UserAlertSetting]:
    """Get all alert settings for a given organization."""
    async with db.tenant_session() as session:
        alert_responses = await orm_user_alert.UserAlertSetting.get_alert_settings(
            session,
            camera_mac_addresses=(
                {camera_mac_address} if camera_mac_address is not None else None
            ),
        )
        alert_settings = [alert.setting for alert in alert_responses]
    return alert_settings


@user_alert_router.get("/alerts")
async def get_user_alerts(
    setting_id: int,
    _app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    db: database.Database = Depends(get_backend_database),
) -> list[models.UserAlert]:
    """Get all alerts fired at for a given alert settings."""
    async with db.tenant_session() as session:
        alerts = await orm_user_alert.UserAlert.get_all_alerts(session, [setting_id])
    return alerts
