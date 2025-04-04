import {
  ClipWidgetReportData,
  CounterWidgetReportData,
  DashboardWidgetType,
  LineChartWidgetReportData,
  ReportData,
} from "coram-common-utils";
import { ComponentType } from "react";
import {
  isClipWidgetReportData,
  isCounterWidgetReportData,
  isLineChartWidgetReportData,
  WidgetProps,
} from "./types";
import { ClipsWidget, CounterWidget, LineChartWidget } from "./components";

interface WidgetConfig<T extends ReportData> {
  Component: ComponentType<WidgetProps>;
  typeGuard: (data: ReportData) => data is T;
}

interface WidgetsConfig {
  [DashboardWidgetType.COUNTER]: WidgetConfig<CounterWidgetReportData>;
  [DashboardWidgetType.LINE_CHART]: WidgetConfig<LineChartWidgetReportData>;
  [DashboardWidgetType.CLIPS]: WidgetConfig<ClipWidgetReportData>;
}

export const WIDGETS: WidgetsConfig = {
  [DashboardWidgetType.COUNTER]: {
    Component: CounterWidget,
    typeGuard: isCounterWidgetReportData,
  },
  [DashboardWidgetType.LINE_CHART]: {
    Component: LineChartWidget,
    typeGuard: isLineChartWidgetReportData,
  },
  [DashboardWidgetType.CLIPS]: {
    Component: ClipsWidget,
    typeGuard: isClipWidgetReportData,
  },
};
