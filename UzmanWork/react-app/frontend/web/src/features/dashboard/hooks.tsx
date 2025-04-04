import { DashboardReportsService, DashboardService } from "coram-common-utils";
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
  convertToServerReport,
  DashboardReport,
  parseDashboardResponse,
} from "./types";
import { useContext } from "react";
import { NotificationContext } from "contexts/notification_context";
import {
  DASHBOARD_QUERY_KEY,
  DASHBOARD_REPORT_DATA_QUERY_KEY,
  DASHBOARD_SUMMARY_QUERY_KEY,
} from "./consts";

export function useCreateDashboard({
  onSuccessCb,
}: {
  onSuccessCb?: (newDashboardId: number) => void;
}) {
  const { setNotificationData } = useContext(NotificationContext);

  return useMutation({
    mutationFn: () => DashboardService.createDashboard(),
    onError: (e) => {
      setNotificationData({
        message: "Failed to create Dashboard",
        severity: "error",
      });
      console.error(e);
    },
    onSuccess: async (newDashboardId) => onSuccessCb?.(newDashboardId),
  });
}

export function useDashboard(dashboardId: number) {
  const queryClient = useQueryClient();
  return useQuery(
    [DASHBOARD_QUERY_KEY, dashboardId],
    async () => {
      const data = await DashboardService.getDashboard(dashboardId);
      return parseDashboardResponse(data);
    },
    {
      refetchOnWindowFocus: false,
      onSuccess: () =>
        queryClient.invalidateQueries(DASHBOARD_SUMMARY_QUERY_KEY),
    }
  );
}

export function useDashboardsSummary() {
  return useQuery(
    [DASHBOARD_SUMMARY_QUERY_KEY],
    async () => DashboardService.dashboardsSummary(),
    {
      refetchOnWindowFocus: false,
    }
  );
}

export function useReportData(reportId: number) {
  return useQuery(
    [DASHBOARD_REPORT_DATA_QUERY_KEY, reportId],
    async () => DashboardReportsService.getReportData(reportId),
    {
      refetchOnWindowFocus: false,
    }
  );
}

export function useSaveReport() {
  const { setNotificationData } = useContext(NotificationContext);

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (report: DashboardReport) =>
      DashboardReportsService.updateReport(convertToServerReport(report)),
    onError: (e) => {
      setNotificationData({
        message: `Failed to update report`,
        severity: "error",
      });
      console.error(e);
    },
    onSuccess: async (_, report) => {
      await queryClient.invalidateQueries([
        DASHBOARD_REPORT_DATA_QUERY_KEY,
        report.id,
      ]);
      await queryClient.invalidateQueries([
        DASHBOARD_QUERY_KEY,
        report.dashboard_id,
      ]);
    },
  });
}
