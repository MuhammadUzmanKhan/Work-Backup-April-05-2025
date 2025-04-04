from fastapi import HTTPException, status

from backend.dashboard.report import models
from backend.database import dashboard_models as db_models
from backend.database.session import TenantAwareAsyncSession


async def get_report_data_or_fail(
    session: TenantAwareAsyncSession, metadata: db_models.DashboardReportMetadata
) -> models.GetReportDataResponse:
    try:
        return await metadata.configuration.get_report_data(
            session=session,
            widget_type=metadata.widget_type,
            start_time=metadata.time_range.get_start_time(),
            end_time=metadata.time_range.get_end_time(),
        )
    except db_models.DashboardException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
