from fastapi import APIRouter, Depends, HTTPException, status

from backend import auth, auth_models
from backend.access_logs.constants import UserActions
from backend.access_logs.utils import AccessLogger
from backend.dashboard.report import models
from backend.dashboard.report import utils as report_utils
from backend.database import database, orm
from backend.database.dashboard_models import DashboardReport
from backend.dependencies import get_backend_database

dashboard_report_router = APIRouter(
    prefix="/reports",
    tags=["dashboard_reports"],
    generate_unique_id_function=lambda route: route.name,
)


@dashboard_report_router.post("/")
async def add_report(
    request: models.DashboardReportCreateRequest,
    db: database.Database = Depends(get_backend_database),
    _app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    _access_logger: AccessLogger = Depends(
        AccessLogger(
            UserActions.ADDED_INSIGHTS_REPORT, ["name", "description", "dashboard_id"]
        )
    ),
) -> DashboardReport:
    async with db.tenant_session() as session:
        try:
            return await orm.DashboardReport.add_report(
                session=session, report_create=request
            )
        except orm.orm_dashboard.DashboardNotFoundError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        except orm.orm_dashboard_report.DashboardReportError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@dashboard_report_router.put("/{report_id}")
async def update_report(
    request: models.DashboardReportUpdateRequest,
    db: database.Database = Depends(get_backend_database),
    _app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
) -> None:
    async with db.tenant_session() as session:
        try:
            await orm.DashboardReport.update_report(session=session, report=request)
        except orm.orm_dashboard_report.DashboardReportError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@dashboard_report_router.delete("/{report_id}")
async def delete_report(
    report_id: int,
    db: database.Database = Depends(get_backend_database),
    _app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    _access_logger: AccessLogger = Depends(
        AccessLogger(UserActions.DELETED_INSIGHTS_REPORT, ["report_id"])
    ),
) -> None:
    async with db.tenant_session() as session:
        try:
            await orm.DashboardReport.delete_report(
                session=session, report_id=report_id
            )
        except orm.orm_dashboard_report.DashboardReportError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@dashboard_report_router.get("/data/{report_id}")
async def get_report_data(
    report_id: int,
    db: database.Database = Depends(get_backend_database),
    _app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
) -> models.GetReportDataResponse:
    async with db.tenant_session(
        session_type=database.SessionType.MODERATELY_SLOW_QUERY
    ) as session:
        try:
            report = await orm.DashboardReport.get_report(
                session=session, report_id=report_id
            )
        except orm.orm_dashboard_report.DashboardReportNotFoundError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

        return await report_utils.get_report_data_or_fail(
            session, report.report_metadata
        )


@dashboard_report_router.post("/actions/data/preview")
async def get_report_data_from_request(
    request: models.DashboardReportDataPreviewGetRequest,
    db: database.Database = Depends(get_backend_database),
    _app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
) -> models.GetReportDataResponse:
    async with db.tenant_session(
        session_type=database.SessionType.MODERATELY_SLOW_QUERY
    ) as session:
        return await report_utils.get_report_data_or_fail(
            session, request.report_metadata
        )


@dashboard_report_router.post("/{report_id}/actions/clone")
async def clone_report(
    report_id: int,
    db: database.Database = Depends(get_backend_database),
    _app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    _access_logger: AccessLogger = Depends(
        AccessLogger(UserActions.CLONED_INSIGHTS_REPORT, ["report_id"])
    ),
) -> DashboardReport:
    async with db.tenant_session() as session:
        try:
            original_report = await orm.DashboardReport.get_report(
                session=session, report_id=report_id
            )

            cloned_report = await orm.DashboardReport.add_report(
                session=session,
                report_create=models.DashboardReportCreateRequest(
                    dashboard_id=original_report.dashboard_id,
                    name=f"{original_report.name} (Clone)",
                    report_metadata=original_report.report_metadata,
                ),
            )

            return cloned_report
        except orm.orm_dashboard_report.DashboardReportError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to clone the report {e}",
            )
