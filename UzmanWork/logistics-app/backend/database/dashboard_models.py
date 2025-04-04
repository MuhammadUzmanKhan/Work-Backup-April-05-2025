from __future__ import annotations

import enum
from abc import ABC, abstractmethod
from datetime import timedelta
from typing import Union

from pydantic import BaseModel, EmailStr

from backend.constants import (
    DASHBOARD_EVENT_COUNTING_TIME_INTERVAL,
    MAX_MOTION_AGGREGATION_TIME_GAP,
    MIN_CONFIDENCE_THRESHOLD,
)
from backend.database import orm
from backend.database.geometry_models import Line2D
from backend.database.models import DetectionObjectTypeCategory
from backend.database.session import TenantAwareAsyncSession
from backend.database.time_range_models import TimeRange
from backend.perception.models import (
    DashboardEventCount,
    DashboardEventInterval,
    DashboardTimeBasedEventCount,
)
from backend.utils import AwareDatetime


class DashboardException(Exception):
    pass


class WidgetTypeUnsupportedError(DashboardException):
    pass


class DashboardReportDataError(DashboardException):
    pass


class DashboardReportWidth(str, enum.Enum):
    FULL = "full"
    HALF = "half"


class DashboardWidgetType(str, enum.Enum):
    COUNTER = "counter"
    CLIPS = "clips"
    LINE_CHART = "line_chart"


class ReportConfigurationType(str, enum.Enum):
    ACTIVITY_IN_REGION = "activity_in_region"
    OBJECT_COUNT = "object_count"
    LINE_CROSSING = "line_crossing"


ReportDataPayload = Union[
    DashboardEventCount,
    list[DashboardEventInterval],
    list[DashboardTimeBasedEventCount],
]


class ReportData(BaseModel):
    widget_type: DashboardWidgetType
    payload: ReportDataPayload


class CounterWidgetReportData(ReportData):
    payload: DashboardEventCount


class LineChartWidgetReportData(ReportData):
    payload: list[DashboardTimeBasedEventCount]


class ClipWidgetReportData(ReportData):
    payload: list[DashboardEventInterval]


class ReportConfigurationBase(ABC, BaseModel):
    report_type: ReportConfigurationType
    object_categories: list[DetectionObjectTypeCategory]

    @abstractmethod
    async def get_report_data(
        self,
        session: TenantAwareAsyncSession,
        widget_type: DashboardWidgetType,
        start_time: AwareDatetime,
        end_time: AwareDatetime,
    ) -> ReportData: ...


class CameraDataSourceWithROI(BaseModel):
    mac_address: str
    roi_polygon: list[list[float]]


class ActivityInRegionReportConfiguration(ReportConfigurationBase):
    report_type = ReportConfigurationType.ACTIVITY_IN_REGION
    camera_data_sources: list[CameraDataSourceWithROI]
    min_event_duration: timedelta
    max_event_time_gap: timedelta

    async def get_report_data(
        self,
        session: TenantAwareAsyncSession,
        widget_type: DashboardWidgetType,
        start_time: AwareDatetime,
        end_time: AwareDatetime,
    ) -> ReportData:
        if widget_type == DashboardWidgetType.COUNTER:
            return CounterWidgetReportData(
                widget_type=DashboardWidgetType.COUNTER,
                payload=(
                    await orm.PerceptionObjectEvent.get_activity_count(
                        session=session,
                        start_time=start_time,
                        end_time=end_time,
                        camera_data_sources=self.camera_data_sources,
                        min_event_length=self.min_event_duration,
                        max_event_time_gap=self.max_event_time_gap,
                        aggregation_time_gap=MAX_MOTION_AGGREGATION_TIME_GAP,
                        confidence_threshold=MIN_CONFIDENCE_THRESHOLD,
                        object_categories=self.object_categories,
                    )
                ),
            )
        elif widget_type == DashboardWidgetType.LINE_CHART:
            return LineChartWidgetReportData(
                widget_type=DashboardWidgetType.LINE_CHART,
                payload=(
                    await orm.PerceptionObjectEvent.get_activity_count_over_time(
                        session=session,
                        start_time=start_time,
                        end_time=end_time,
                        camera_data_sources=self.camera_data_sources,
                        min_event_length=self.min_event_duration,
                        max_event_time_gap=self.max_event_time_gap,
                        aggregation_time_gap=MAX_MOTION_AGGREGATION_TIME_GAP,
                        confidence_threshold=MIN_CONFIDENCE_THRESHOLD,
                        time_interval=DASHBOARD_EVENT_COUNTING_TIME_INTERVAL,
                        object_categories=self.object_categories,
                    )
                ),
            )
        elif widget_type == DashboardWidgetType.CLIPS:
            return ClipWidgetReportData(
                widget_type=DashboardWidgetType.CLIPS,
                payload=(
                    await orm.PerceptionObjectEvent.get_activity_intervals(
                        session=session,
                        start_time=start_time,
                        end_time=end_time,
                        camera_data_sources=self.camera_data_sources,
                        min_event_length=self.min_event_duration,
                        max_event_time_gap=self.max_event_time_gap,
                        aggregation_time_gap=MAX_MOTION_AGGREGATION_TIME_GAP,
                        confidence_threshold=MIN_CONFIDENCE_THRESHOLD,
                        object_categories=self.object_categories,
                    )
                ),
            )
        else:
            raise WidgetTypeUnsupportedError(
                f"Unsupported widget type {widget_type} for report type"
                f" {self.report_type}"
            )


class ObjectCountReportConfiguration(ReportConfigurationBase):
    report_type = ReportConfigurationType.OBJECT_COUNT
    camera_data_sources: list[CameraDataSourceWithROI]

    async def get_report_data(
        self,
        session: TenantAwareAsyncSession,
        widget_type: DashboardWidgetType,
        start_time: AwareDatetime,
        end_time: AwareDatetime,
    ) -> ReportData:
        if widget_type == DashboardWidgetType.COUNTER:
            return CounterWidgetReportData(
                widget_type=DashboardWidgetType.COUNTER,
                payload=(
                    await orm.PerceptionObjectEvent.get_object_count(
                        session=session,
                        start_time=start_time,
                        end_time=end_time,
                        camera_data_sources=self.camera_data_sources,
                        confidence_threshold=MIN_CONFIDENCE_THRESHOLD,
                        object_categories=self.object_categories,
                    )
                ),
            )
        elif widget_type == DashboardWidgetType.LINE_CHART:
            return LineChartWidgetReportData(
                widget_type=DashboardWidgetType.LINE_CHART,
                payload=(
                    await orm.PerceptionObjectEvent.get_object_count_over_time(
                        session=session,
                        start_time=start_time,
                        end_time=end_time,
                        camera_data_sources=self.camera_data_sources,
                        confidence_threshold=MIN_CONFIDENCE_THRESHOLD,
                        time_interval=DASHBOARD_EVENT_COUNTING_TIME_INTERVAL,
                        object_categories=self.object_categories,
                    )
                ),
            )
        else:
            raise WidgetTypeUnsupportedError(
                f"Unsupported widget type {widget_type} for report type"
                f" {self.report_type}"
            )


class LineCrossingDirection(str, enum.Enum):
    LEFT = "left"
    RIGHT = "right"
    BOTH = "both"


class LineCrossingCameraDataSource(BaseModel):
    mac_address: str
    line: Line2D | None
    direction: LineCrossingDirection


class LineCrossingReportConfiguration(ReportConfigurationBase):
    report_type = ReportConfigurationType.LINE_CROSSING
    camera_data_sources: list[LineCrossingCameraDataSource]

    async def get_report_data(
        self,
        session: TenantAwareAsyncSession,
        widget_type: DashboardWidgetType,
        start_time: AwareDatetime,
        end_time: AwareDatetime,
    ) -> ReportData:
        if widget_type == DashboardWidgetType.COUNTER:
            return CounterWidgetReportData(
                widget_type=DashboardWidgetType.COUNTER,
                payload=(
                    await orm.PerceptionObjectEvent.get_line_crossing_count(
                        session=session,
                        start_time=start_time,
                        end_time=end_time,
                        camera_data_sources=self.camera_data_sources,
                        confidence_threshold=MIN_CONFIDENCE_THRESHOLD,
                        object_categories=self.object_categories,
                    )
                ),
            )
        elif widget_type == DashboardWidgetType.LINE_CHART:
            return LineChartWidgetReportData(
                widget_type=DashboardWidgetType.LINE_CHART,
                payload=(
                    await orm.PerceptionObjectEvent.get_line_crossing_count_over_time(
                        session=session,
                        start_time=start_time,
                        end_time=end_time,
                        camera_data_sources=self.camera_data_sources,
                        confidence_threshold=MIN_CONFIDENCE_THRESHOLD,
                        time_interval=DASHBOARD_EVENT_COUNTING_TIME_INTERVAL,
                        object_categories=self.object_categories,
                    )
                ),
            )
        elif widget_type == DashboardWidgetType.CLIPS:
            return ClipWidgetReportData(
                widget_type=DashboardWidgetType.CLIPS,
                payload=(
                    await orm.PerceptionObjectEvent.get_line_crossing_intervals(
                        session=session,
                        start_time=start_time,
                        end_time=end_time,
                        camera_data_sources=self.camera_data_sources,
                        confidence_threshold=MIN_CONFIDENCE_THRESHOLD,
                        object_categories=self.object_categories,
                    )
                ),
            )
        else:
            raise WidgetTypeUnsupportedError(
                f"Unsupported widget type {widget_type} for report type"
                f" {self.report_type}"
            )


class DashboardReportMetadata(BaseModel):
    width: DashboardReportWidth
    time_range: TimeRange
    widget_type: DashboardWidgetType
    configuration: Union[
        ActivityInRegionReportConfiguration,
        LineCrossingReportConfiguration,
        ObjectCountReportConfiguration,
    ]


class DashboardReportBase(BaseModel):
    name: str
    description: str | None
    dashboard_id: int
    # Attribute name 'metadata' is reserved for the MetaData instance when
    # using a declarative base class.
    report_metadata: DashboardReportMetadata


class DashboardReportCreate(DashboardReportBase):
    pass


class DashboardReport(DashboardReportBase):
    id: int

    class Config:
        orm_mode = True


class DashboardBase(BaseModel):
    owner_user_email: EmailStr
    creation_time: AwareDatetime


class DashboardCreate(DashboardBase):
    pass


class DashboardSummaryModel(DashboardBase):
    id: int
    title: str
    description: str | None

    class Config:
        orm_mode = True


class Dashboard(DashboardBase):
    id: int
    title: str
    description: str | None
    reports: list[DashboardReport] = []

    class Config:
        orm_mode = True

    def reorder_reports(self, reports_order: list[int]) -> None:
        ordered_reports = []
        report_dict = {report.id: report for report in self.reports}

        for report_id in reports_order:
            report = report_dict.pop(report_id, None)
            if report:
                ordered_reports.append(report)

        # Append any remaining reports that were not explicitly ordered
        ordered_reports.extend(report_dict.values())

        self.reports = ordered_reports


class DashboardUserViewLogBase(BaseModel):
    dashboard_id: int
    user_email: EmailStr
    timestamp: AwareDatetime


class DashboardUserViewLogCreate(DashboardUserViewLogBase):
    pass


class DashboardUserViewLog(DashboardUserViewLogBase):
    id: int

    class Config:
        orm_mode = True


class DashboardUserPreferenceBase(BaseModel):
    user_email: EmailStr
    favorite_dashboard_id: int | None = None


class DashboardUserPreferenceCreate(DashboardUserPreferenceBase):
    pass


class DashboardUserPreference(DashboardUserPreferenceBase):
    id: int

    class Config:
        orm_mode = True
