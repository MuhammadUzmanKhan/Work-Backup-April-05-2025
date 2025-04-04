from typing import Protocol

from backend.dashboard.report import models as report_models


class DashboardReportCreateRequestFactory(Protocol):
    def __call__(self, dashboard_id: int) -> report_models.DashboardReportCreateRequest:
        pass
