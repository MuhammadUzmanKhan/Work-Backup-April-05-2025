import logging

from pydantic import BaseModel

from backend import logging_config
from backend.value_store import ValueStore

logger = logging.getLogger(logging_config.LOGGER_NAME)


class UserFavoriteDashboard(BaseModel):
    dashboard_id: int


def _get_favorite_dashboard_key(tenant: str) -> str:
    return f"user_favorite_dashboard:{tenant}"


async def set_user_favorite_dashboard(
    tenant: str, user_email: str, dashboard_id: int, value_store: ValueStore
) -> None:
    await value_store.hset_model(
        key=_get_favorite_dashboard_key(tenant),
        mapping_key=user_email,
        model=UserFavoriteDashboard(dashboard_id=dashboard_id),
    )


async def unset_user_favorite_dashboard(
    tenant: str, user_email: str, value_store: ValueStore
) -> None:
    await value_store.hdel_model(
        _get_favorite_dashboard_key(tenant),
        user_email,
        model_class=UserFavoriteDashboard,
    )


async def get_user_favorite_dashboard_id(
    tenant: str,
    user_email: str,
    value_store: ValueStore,
    available_dashboard_ids: list[int],
) -> int | None:
    favorite_dashboard = await value_store.hget_model(
        key=_get_favorite_dashboard_key(tenant),
        mapping_key=user_email,
        model_class=UserFavoriteDashboard,
    )
    if favorite_dashboard is None:
        return None

    if favorite_dashboard.dashboard_id not in available_dashboard_ids:
        logger.error(
            f"Favorite dashboard {favorite_dashboard.dashboard_id} for user"
            f" {user_email} not found in the database"
        )
        return None

    return favorite_dashboard.dashboard_id


async def delete_dashboard_from_user_favorite_dashboards(
    tenant: str, dashboard_id: int, value_store: ValueStore
) -> None:
    key = _get_favorite_dashboard_key(tenant)
    # Retrieve all users' favorite dashboard
    all_users_favorite_dashboards = await value_store.hgetall_models(
        key=key, model_class=UserFavoriteDashboard
    )
    # Iterate through all user favorite dashboards and delete the record if it
    # matches the provided dashboard ID
    users_to_delete = [
        user_email
        for user_email, favorite_dashboard in all_users_favorite_dashboards.items()
        if favorite_dashboard.dashboard_id == dashboard_id
    ]
    await value_store.hdel_model(
        key, *users_to_delete, model_class=UserFavoriteDashboard
    )
