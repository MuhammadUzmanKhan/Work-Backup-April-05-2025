import { CircularProgress, Stack } from "@mui/material";
import { isDefined } from "coram-common-utils";
import { useDashboardsSummary } from "features/dashboard/hooks";
import { NoDashboardExist, ViewDashboard } from "features/dashboard";
import { z } from "zod";
import { OptionalIntParam, withValidatedPathParams } from "common/utils";

const DashboardPagePathParamsSchema = z.object({
  dashboardId: OptionalIntParam,
});

type DashboardPagePathParams = z.infer<typeof DashboardPagePathParamsSchema>;

function DashboardPageImpl({ dashboardId }: DashboardPagePathParams) {
  const { data: dashboardsSummary, isLoading: isDashboardsSummaryLoading } =
    useDashboardsSummary();

  if (isDashboardsSummaryLoading) {
    return (
      <Stack pt={15} justifyContent="center" alignItems="center">
        <CircularProgress size={45} color="secondary" />
      </Stack>
    );
  }
  const targetDashboardId = !isDefined(dashboardId)
    ? dashboardsSummary?.default_dashboard_id
    : dashboardId;

  if (!isDefined(targetDashboardId)) {
    return <NoDashboardExist />;
  }

  return <ViewDashboard dashboardId={targetDashboardId} />;
}

export const DashboardPage = withValidatedPathParams(
  DashboardPageImpl,
  DashboardPagePathParamsSchema
);
