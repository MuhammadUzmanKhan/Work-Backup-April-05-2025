import { Stack } from "@mui/system";
import { TOOLBAR_HEIGHT_PX } from "components/navbar/navbar";
import {
  DashboardHeader,
  DashboardReportsMuuriGrid,
  NoReportsExistPlaceholder,
} from "./components";
import { useDashboard } from "../hooks";
import { Navigate, useNavigate } from "react-router-dom";
import { DashboardReportsService, DashboardService } from "coram-common-utils";
import { useCreateNewReport } from "./hooks";
import { LoadingBox } from "components/video/LoadingBox";
import { DashboardReport } from "../types";
import { useContext, useState } from "react";
import { NotificationContext } from "contexts/notification_context";
import { PathNames } from "hooks/usePageNavigation";

interface DashboardProps {
  dashboardId: number;
}

export function ViewDashboard({ dashboardId }: DashboardProps) {
  const { setNotificationData } = useContext(NotificationContext);

  const navigate = useNavigate();

  const {
    data: dashboard,
    isSuccess: isFetchDashboardSuccess,
    isLoading: isDashboardLoading,
    refetch: refetchDashboard,
  } = useDashboard(dashboardId);

  const { isLoading: isCreatingReport, mutateAsync: createReport } =
    useCreateNewReport();

  const [scrollToReportId, setScrollToReportId] = useState<number>();

  if (isDashboardLoading) {
    return <LoadingBox />;
  }

  if (!isFetchDashboardSuccess) {
    return <Navigate to="/404" replace />;
  }

  function handleEditReport(reportId: number) {
    navigate(`${PathNames.INSIGHTS}/${dashboardId}/report/${reportId}`);
  }

  async function handleReportReorder(reportsOrder: number[]) {
    await DashboardService.updateReportsOrder(dashboardId, {
      reports_order: reportsOrder,
    });
    await refetchDashboard();
  }

  async function handleCloneReport(report: DashboardReport) {
    try {
      const clonedReport = await DashboardReportsService.cloneReport(report.id);
      setNotificationData({
        message: "The Report cloned successfully",
        severity: "success",
      });
      setScrollToReportId(clonedReport.id);
    } catch (e) {
      console.error("Error cloning report", e);
      setNotificationData({
        message: "Failed to clone the Report",
        severity: "error",
      });
    } finally {
      await refetchDashboard();
    }
  }

  async function handleDeleteReport(report: DashboardReport) {
    try {
      await DashboardReportsService.deleteReport(report.id);
      setNotificationData({
        message: `Report ${report.name} was successfully deleted`,
        severity: "success",
      });
    } catch (e) {
      console.error("Error while deleting report", e);
      setNotificationData({
        message: `Failed to delete ${report.name} report`,
        severity: "error",
      });
    } finally {
      await refetchDashboard();
    }
  }

  return (
    <Stack
      gap={3}
      height={`calc(100vh - ${TOOLBAR_HEIGHT_PX}px)`}
      bgcolor="common.white"
    >
      <DashboardHeader
        dashboard={dashboard}
        refetchDashboard={refetchDashboard}
        onSelectDashboard={async (dashboardId) => {
          navigate(`${PathNames.INSIGHTS}/${dashboardId}`);
        }}
        onCreateReport={async () => {
          const report = await createReport(dashboardId);
          handleEditReport(report.id);
        }}
        isCreatingReport={isCreatingReport}
      />
      <Stack justifyContent="center" maxHeight="100%" pl={2} pr={1}>
        {dashboard.reports.length > 0 ? (
          <DashboardReportsMuuriGrid
            reports={dashboard.reports}
            scrollToReportId={scrollToReportId}
            onEditReport={(report) => handleEditReport(report.id)}
            onCloneReport={handleCloneReport}
            onDeleteReport={handleDeleteReport}
            onReportReorder={handleReportReorder}
            onScrollEnd={() => setScrollToReportId(undefined)}
          />
        ) : (
          <NoReportsExistPlaceholder />
        )}
      </Stack>
    </Stack>
  );
}
