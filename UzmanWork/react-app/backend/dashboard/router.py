import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import EmailStr

from backend import auth, auth_models, logging_config
from backend.access_logs.constants import UserActions
from backend.access_logs.utils import AccessLogger
from backend.dashboard.constants import NUM_RECENTLY_VIEWED_DASHBOARDS
from backend.dashboard.models import (
    DashboardDetailsUpdateRequest,
    DashboardResponse,
    DashboardsSummaryReponse,
    DashboardSummary,
    ReportsOrderUpdateRequest,
    UserFavoriteDashboardUpdateRequest,
)
from backend.dashboard.report.router import dashboard_report_router
from backend.dashboard.user_favorite.utils import (
    delete_dashboard_from_user_favorite_dashboards,
    get_user_favorite_dashboard_id,
    set_user_favorite_dashboard,
    unset_user_favorite_dashboard,
)
from backend.dashboard.user_view_tracker.utils import (
    delete_dashboard_from_dashboard_views,
    get_recently_viewed_dashboard_ids,
    record_user_dashboard_view,
)
from backend.database import database, orm
from backend.database.dashboard_models import DashboardCreate
from backend.database.orm.orm_dashboard import DashboardDeleteError
from backend.dependencies import get_backend_database, get_value_store
from backend.fastapi_utils import WithResponseExcludeNone
from backend.utils import AwareDatetime
from backend.value_store import ValueStore

logger = logging.getLogger(logging_config.LOGGER_NAME)

dashboard_router = WithResponseExcludeNone(
    APIRouter(
        prefix="/dashboard",
        tags=["dashboard"],
        generate_unique_id_function=lambda route: route.name,
    )
)


@dashboard_router.post("/")
async def create_dashboard(
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    value_store: ValueStore = Depends(get_value_store),
    _access_logger: None = Depends(
        AccessLogger(user_action=UserActions.CREATE_DASHBOARD)
    ),
) -> int:
    async with db.tenant_session() as session:
        try:
            dashboard_id = await orm.Dashboard.create_dashboard(
                session=session,
                dashboard_create=DashboardCreate(
                    owner_user_email=EmailStr(app_user.user_email),
                    creation_time=AwareDatetime.utcnow(),
                ),
            )
        except orm.orm_dashboard.DashboardError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

        await record_user_dashboard_view(
            tenant=app_user.tenant,
            user_email=app_user.user_email,
            dashboard_id=dashboard_id,
            value_store=value_store,
        )
    return dashboard_id


@dashboard_router.delete("/{dashboard_id}")
async def delete_dashboard(
    dashboard_id: int,
    db: database.Database = Depends(get_backend_database),
    value_store: ValueStore = Depends(get_value_store),
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    _access_logger: None = Depends(
        AccessLogger(user_action=UserActions.DELETE_DASHBOARD)
    ),
) -> None:
    async with db.tenant_session() as session:
        try:
            await orm.Dashboard.delete_dashboard(
                session=session, dashboard_id=dashboard_id
            )
        except DashboardDeleteError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    await delete_dashboard_from_dashboard_views(
        tenant=app_user.tenant, dashboard_id=dashboard_id, value_store=value_store
    )

    await delete_dashboard_from_user_favorite_dashboards(
        tenant=app_user.tenant, dashboard_id=dashboard_id, value_store=value_store
    )


@dashboard_router.get("/summary")
async def dashboards_summary(
    db: database.Database = Depends(get_backend_database),
    value_store: ValueStore = Depends(get_value_store),
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
) -> DashboardsSummaryReponse:
    async with db.tenant_session() as session:
        dashboards = await orm.Dashboard.get_dashboards(session=session)

    available_dashboard_ids = [dashboard.id for dashboard in dashboards]

    favorite_dashboard_id = await get_user_favorite_dashboard_id(
        tenant=app_user.tenant,
        user_email=app_user.user_email,
        value_store=value_store,
        available_dashboard_ids=available_dashboard_ids,
    )

    recently_viewed_dashboards_ids = await get_recently_viewed_dashboard_ids(
        tenant=app_user.tenant,
        user_email=app_user.user_email,
        value_store=value_store,
        available_dashboard_ids=available_dashboard_ids,
        limit=NUM_RECENTLY_VIEWED_DASHBOARDS,
    )

    all_dashboards_summary = [
        DashboardSummary(
            **dashboard.dict(), is_favorite=dashboard.id == favorite_dashboard_id
        )
        for dashboard in dashboards
    ]

    # Set the default dashboard ID to the favorite dashboard ID if it exists, otherwise
    # the most recently viewed dashboard ID if it exists, otherwise the first available
    # dashboard ID if it exists
    default_dashboard_id = favorite_dashboard_id or (
        recently_viewed_dashboards_ids[0]
        if recently_viewed_dashboards_ids
        else available_dashboard_ids[0] if available_dashboard_ids else None
    )

    return DashboardsSummaryReponse(
        all_dashboards_summary=all_dashboards_summary,
        recently_viewed_dashboards_ids=recently_viewed_dashboards_ids,
        default_dashboard_id=default_dashboard_id,
    )


@dashboard_router.get("/{dashboard_id}")
async def get_dashboard(
    dashboard_id: int,
    db: database.Database = Depends(get_backend_database),
    value_store: ValueStore = Depends(get_value_store),
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
) -> DashboardResponse:
    async with db.tenant_session() as session:
        try:
            dashboard = await orm.Dashboard.get_dashboard_by_id(
                session=session, dashboard_id=dashboard_id
            )
        except orm.orm_dashboard.DashboardNotFoundError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    await record_user_dashboard_view(
        app_user.tenant, app_user.user_email, dashboard_id, value_store
    )

    return DashboardResponse(
        id=dashboard.id,
        title=dashboard.title,
        description=dashboard.description,
        owner_user_email=dashboard.owner_user_email,
        creation_time=dashboard.creation_time,
        reports=dashboard.reports,
    )


@dashboard_router.patch("/")
async def update_dashboard_details(
    request: DashboardDetailsUpdateRequest,
    db: database.Database = Depends(get_backend_database),
    _app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    _access_logger: AccessLogger = Depends(
        AccessLogger(
            UserActions.UPDATED_INSIGHTS_DETAILS, ["id", "title", "description"]
        )
    ),
) -> None:
    async with db.tenant_session() as session:
        try:
            await orm.Dashboard.update_dashboard_details(
                session=session,
                dashboard_id=request.id,
                title=request.title,
                description=request.description,
            )
        except orm.orm_dashboard.DashboardUpdateError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@dashboard_router.patch("/{dashboard_id}/reports-order")
async def update_reports_order(
    dashboard_id: int,
    request: ReportsOrderUpdateRequest,
    db: database.Database = Depends(get_backend_database),
    _app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
) -> None:
    async with db.tenant_session() as session:
        try:
            await orm.Dashboard.update_reports_order(
                session=session,
                dashboard_id=dashboard_id,
                reports_order=request.reports_order,
            )
        except orm.orm_dashboard.DashboardUpdateError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@dashboard_router.post("/update_user_favorite")
async def update_user_favorite(
    request: UserFavoriteDashboardUpdateRequest,
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    value_store: ValueStore = Depends(get_value_store),
) -> None:
    if request.is_favorite:
        # Set the favorite dashboard for the user
        await set_user_favorite_dashboard(
            tenant=app_user.tenant,
            user_email=app_user.user_email,
            dashboard_id=request.dashboard_id,
            value_store=value_store,
        )
    else:
        # Unset the favorite dashboard for the user
        await unset_user_favorite_dashboard(
            tenant=app_user.tenant,
            user_email=app_user.user_email,
            value_store=value_store,
        )


dashboard_router.include_router(dashboard_report_router)
