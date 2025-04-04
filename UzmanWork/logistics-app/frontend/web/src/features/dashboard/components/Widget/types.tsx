import {
  ClipWidgetReportData,
  CounterWidgetReportData,
  DashboardWidgetType,
  LineChartWidgetReportData,
  ReportData,
} from "coram-common-utils";

export type WidgetProps = {
  reportName: string;
  isDataReady: boolean;
  data: ReportData | undefined;
  widgetType: DashboardWidgetType;
};

export function isClipWidgetReportData(
  data: ReportData
): data is ClipWidgetReportData {
  return data.widget_type === DashboardWidgetType.CLIPS;
}

export function isCounterWidgetReportData(
  data: ReportData
): data is CounterWidgetReportData {
  return data.widget_type === DashboardWidgetType.COUNTER;
}

export function isLineChartWidgetReportData(
  data: ReportData
): data is LineChartWidgetReportData {
  return data.widget_type === DashboardWidgetType.LINE_CHART;
}
