import {
  ClipWidgetReportData,
  CounterWidgetReportData,
  DashboardWidgetType,
  DetectionObjectTypeCategory,
  LineChartWidgetReportData,
} from "coram-common-utils";

export const COUNTER_WIDGET_REPORT_DATA: CounterWidgetReportData = {
  widget_type: DashboardWidgetType.COUNTER,
  payload: {
    event_count: 2,
  },
};

export const LINE_CHART_WIDGET_REPORT_DATA: LineChartWidgetReportData = {
  widget_type: DashboardWidgetType.LINE_CHART,
  payload: [
    {
      time: "2024-03-05T10:37:00+00:00",
      event_count: 2,
    },
    {
      time: "2024-03-05T11:37:00+00:00",
      event_count: 4,
    },
    {
      time: "2024-03-05T12:37:00+00:00",
      event_count: 1,
    },
  ],
};

export const CLIPS_WIDGET_REPORT_DATA: ClipWidgetReportData = {
  widget_type: DashboardWidgetType.CLIPS,
  payload: [
    {
      start_time: "2024-03-05T14:47:59.268042+00:00",
      end_time: "2024-03-05T14:48:05.467895+00:00",
      mac_address: "F0:00:00:CA:6D:AD",
      object_category: DetectionObjectTypeCategory.PERSON,
    },
    {
      start_time: "2024-03-05T14:48:25.864119+00:00",
      end_time: "2024-03-05T14:48:40.261193+00:00",
      mac_address: "F0:00:00:CA:6D:AD",
      object_category: DetectionObjectTypeCategory.PERSON,
    },
  ],
};
