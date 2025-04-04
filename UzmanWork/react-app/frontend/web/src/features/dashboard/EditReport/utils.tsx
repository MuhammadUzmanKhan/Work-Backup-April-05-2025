import { WIDGET_TYPE_TO_REPORT_WIDTH } from "./consts";
import { DashboardReportWidth, DashboardWidgetType } from "coram-common-utils";

export function getReportWidth(widgetType: DashboardWidgetType) {
  return (
    WIDGET_TYPE_TO_REPORT_WIDTH.get(widgetType) ?? DashboardReportWidth.HALF
  );
}
