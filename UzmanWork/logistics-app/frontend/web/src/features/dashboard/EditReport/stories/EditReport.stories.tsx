import type { Meta, StoryObj } from "@storybook/react";
import { EditReport } from "../EditReport";
import {
  DASHBOARD_WITH_COUNTER_REPORT,
  dashboardAPIMocks,
} from "features/dashboard/stories";
import { parseDashboardResponse } from "features/dashboard/types";

const meta: Meta<typeof EditReport> = {
  title: "Dashboard/EditReport",
  component: EditReport,
  tags: ["autodocs"],
  parameters: {
    msw: {
      handlers: { ...dashboardAPIMocks },
    },
  },
};

export default meta;
type Story = StoryObj<typeof EditReport>;

export const WithCounterWidget: Story = {
  render: () => {
    const dashboard = parseDashboardResponse(DASHBOARD_WITH_COUNTER_REPORT);
    return <EditReport dashboard={dashboard} report={dashboard.reports[0]} />;
  },
};
