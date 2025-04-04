import type { Meta, StoryObj } from "@storybook/react";
import { ViewDashboard } from "../ViewDashboard";
import {
  DASHBOARD_WITH_COUNTER_REPORT,
  DASHBOARD_WITH_NO_REPORTS,
  dashboardAPIMocks,
} from "features/dashboard/stories";
import devices_page_handlers from "mocks/devices_handlers";

const meta: Meta<typeof ViewDashboard> = {
  title: "Dashboard/ViewDashboard",
  component: ViewDashboard,
  tags: ["autodocs"],
  parameters: {
    msw: {
      handlers: {
        ...dashboardAPIMocks,
        ...devices_page_handlers,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ViewDashboard>;

export const WithCounterReport: Story = {
  render: () => (
    <ViewDashboard dashboardId={DASHBOARD_WITH_COUNTER_REPORT.id} />
  ),
};

export const NoReportsExist: Story = {
  render: () => <ViewDashboard dashboardId={DASHBOARD_WITH_NO_REPORTS.id} />,
};
