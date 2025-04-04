import { EditReport } from "features/dashboard";
import { z } from "zod";
import { IntParam, withValidatedPathParams } from "common/utils";
import { useDashboard } from "features/dashboard/hooks";
import { Navigate } from "react-router-dom";
import { LoadingBox } from "components/video/LoadingBox";
import { isDefined } from "coram-common-utils";

const EditReportPageParamsSchema = z.object({
  dashboardId: IntParam,
  reportId: IntParam,
});

type EditReportPageParams = z.infer<typeof EditReportPageParamsSchema>;

function EditReportPageImpl({ dashboardId, reportId }: EditReportPageParams) {
  const {
    data: dashboard,
    isLoading: isDashboardLoading,
    isSuccess: isFetchDashboardSuccess,
  } = useDashboard(dashboardId);

  if (isDashboardLoading) {
    return <LoadingBox />;
  }

  const report = dashboard?.reports.find((r) => r.id === reportId);
  if (!isFetchDashboardSuccess || !isDefined(report)) {
    return <Navigate to="/404" replace />;
  }

  return <EditReport dashboard={dashboard} report={report} />;
}

export const EditReportPage = withValidatedPathParams(
  EditReportPageImpl,
  EditReportPageParamsSchema
);
