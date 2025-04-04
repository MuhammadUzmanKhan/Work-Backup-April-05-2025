import logging
from typing import Dict

from pydantic import BaseModel

from backend import logging_config
from backend.utils import AwareDatetime
from backend.value_store import ValueStore

logger = logging.getLogger(logging_config.LOGGER_NAME)


class DashboardUserViewTracker(BaseModel):
    # The user view logs with dashboard id as key and latest viewing timestamp as value
    dashboard_views: Dict[int, AwareDatetime]


def _get_dashboard_view_key(tenant: str) -> str:
    return f"user_dashboard_view:{tenant}"


async def record_user_dashboard_view(
    tenant: str, user_email: str, dashboard_id: int, value_store: ValueStore
) -> None:
    """Record the user's view of the dashboard."""

    # Get the dashboard user view tracker
    key = _get_dashboard_view_key(tenant)
    tracker = await value_store.hget_model(
        key=key, mapping_key=user_email, model_class=DashboardUserViewTracker
    )
    if tracker is None:
        tracker = DashboardUserViewTracker(dashboard_views={})

    # Update the dashboard views with the user's view timestamp
    tracker.dashboard_views[dashboard_id] = AwareDatetime.utcnow()

    # Save the updated dashboard views
    await value_store.hset_model(key=key, mapping_key=user_email, model=tracker)


async def delete_dashboard_from_dashboard_views(
    tenant: str, dashboard_id: int, value_store: ValueStore
) -> None:
    # Get all user view trackers
    key = _get_dashboard_view_key(tenant)
    all_users_view_trackers = await value_store.hgetall_models(
        key=key, model_class=DashboardUserViewTracker
    )
    # Iterate through all user view trackers and delete the dashboard view for the
    # given deleted dashboard
    for user_email, tracker in all_users_view_trackers.items():
        if dashboard_id in tracker.dashboard_views:
            del tracker.dashboard_views[dashboard_id]
            await value_store.hset_model(key=key, mapping_key=user_email, model=tracker)


async def get_recently_viewed_dashboard_ids(
    tenant: str,
    user_email: str,
    value_store: ValueStore,
    available_dashboard_ids: list[int],
    limit: int,
) -> list[int]:
    """Get recently viewed dashboards for the user."""

    # Get the user's dashboard view tracker
    key = _get_dashboard_view_key(tenant)
    tracker = await value_store.hget_model(
        key=key, mapping_key=user_email, model_class=DashboardUserViewTracker
    )

    if tracker is None:
        return []

    viewed_dashboard_ids = set(tracker.dashboard_views.keys())

    unavailable_viewed_dashboard_ids = viewed_dashboard_ids - set(
        available_dashboard_ids
    )
    if unavailable_viewed_dashboard_ids:
        logger.error(
            f"Recently viewed dashboards {unavailable_viewed_dashboard_ids} are not"
            " found in the database."
        )
        available_viewed_dashboard_ids = viewed_dashboard_ids & set(
            available_dashboard_ids
        )
    else:
        available_viewed_dashboard_ids = viewed_dashboard_ids

    # Sort the dashboard views by timestamp and return the most recent ones
    dashboard_views = tracker.dashboard_views
    return sorted(
        available_viewed_dashboard_ids,
        key=lambda dashboard_id: dashboard_views[dashboard_id],
        reverse=True,
    )[:limit]
