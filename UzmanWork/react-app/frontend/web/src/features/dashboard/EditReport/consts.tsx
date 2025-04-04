import { DashboardReportWidth, DashboardWidgetType } from "coram-common-utils";

export const WIDGET_TYPE_TO_REPORT_WIDTH = new Map([
  [DashboardWidgetType.COUNTER, DashboardReportWidth.HALF],
  [DashboardWidgetType.LINE_CHART, DashboardReportWidth.HALF],
  [DashboardWidgetType.CLIPS, DashboardReportWidth.FULL],
]);
