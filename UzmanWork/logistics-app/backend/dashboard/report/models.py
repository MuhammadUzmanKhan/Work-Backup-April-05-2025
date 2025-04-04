from typing import Union

from backend.database import dashboard_models as db_models


class DashboardReportCreateRequest(db_models.DashboardReportCreate):
    pass


class DashboardReportUpdateRequest(db_models.DashboardReport):
    pass


class DashboardReportDataPreviewGetRequest(db_models.DashboardReport):
    pass


class DashboardReportResponse(db_models.DashboardReport):
    pass


GetReportDataResponse = Union[
    db_models.ReportData,
    db_models.CounterWidgetReportData,
    db_models.LineChartWidgetReportData,
    db_models.ClipWidgetReportData,
]
