import type { Meta, StoryObj } from "@storybook/react";
import { Widget } from "../Widget";
import { DashboardWidgetType } from "coram-common-utils";
import {
  CLIPS_WIDGET_REPORT_DATA,
  COUNTER_WIDGET_REPORT_DATA,
  LINE_CHART_WIDGET_REPORT_DATA,
} from "./consts";
import { dashboardAPIMocks } from "features/dashboard/stories";

const meta: Meta<typeof Widget> = {
  title: "Dashboard/Widget",
  component: Widget,
  tags: ["autodocs"],
  parameters: {
    msw: {
      handlers: {
        ...dashboardAPIMocks,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Widget>;

export const CounterWidget: Story = {
  render: () => (
    <Widget
      reportName="Counter Widget"
      isDataReady={true}
      data={COUNTER_WIDGET_REPORT_DATA}
      widgetType={DashboardWidgetType.COUNTER}
    />
  ),
};

export const LineChartWidget: Story = {
  render: () => (
    <Widget
      reportName="Line Chart Widget"
      isDataReady={true}
      data={LINE_CHART_WIDGET_REPORT_DATA}
      widgetType={DashboardWidgetType.LINE_CHART}
    />
  ),
};

export const ClipsWidget: Story = {
  render: () => (
    <Widget
      reportName="Clips Widget"
      isDataReady={true}
      data={CLIPS_WIDGET_REPORT_DATA}
      widgetType={DashboardWidgetType.CLIPS}
    />
  ),
};
