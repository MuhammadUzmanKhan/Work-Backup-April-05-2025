from datetime import timedelta

import pytest_asyncio

from backend.dashboard.report import models as report_models
from backend.database import dashboard_models as dashboard_db_models
from backend.database import database, orm, time_range_models
from backend.database.models import DetectionObjectTypeCategory
from backend.test.dashboard.report.factory_types import (
    DashboardReportCreateRequestFactory,
)


@pytest_asyncio.fixture
def create_dashboard_report_create_request() -> DashboardReportCreateRequestFactory:
    def create_dashboard_report_create_request_inner(
        dashboard_id: int,
    ) -> report_models.DashboardReportCreateRequest:
        return report_models.DashboardReportCreateRequest(
            dashboard_id=dashboard_id,
            name="Report 1",
            description="Description 1",
            report_metadata=dashboard_db_models.DashboardReportMetadata(
                width=dashboard_db_models.DashboardReportWidth.FULL,
                time_range=time_range_models.RelativeTimeRange(
                    time_interval=timedelta(days=1)
                ),
                widget_type=dashboard_db_models.DashboardWidgetType.COUNTER,
                configuration=dashboard_db_models.ActivityInRegionReportConfiguration(
                    camera_data_sources=[],
                    min_event_duration=timedelta(seconds=1),
                    max_event_time_gap=timedelta(seconds=1),
                    object_categories=[DetectionObjectTypeCategory.MOTION],
                ),
            ),
        )

    return create_dashboard_report_create_request_inner


@pytest_asyncio.fixture
async def report(
    db_instance: database.Database,
    dashboard: dashboard_db_models.Dashboard,
    create_dashboard_report_create_request: DashboardReportCreateRequestFactory,
    organization: orm.Organization,
) -> dashboard_db_models.DashboardReport:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        return await orm.DashboardReport.add_report(
            session=session,
            report_create=create_dashboard_report_create_request(dashboard.id),
        )
