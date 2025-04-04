import {
  DashboardReportsService,
  DashboardReportWidth,
  DashboardWidgetType,
  RelativeTimeRange,
  ReportConfigurationType,
} from "coram-common-utils";
import { useContext } from "react";
import { useMutation, useQueryClient } from "react-query";
import { NotificationContext } from "contexts/notification_context";
import { getDefaultReportConfiguration } from "../utils";
import { convertToServerConfiguration } from "../types";

export function useCreateNewReport() {
  const { setNotificationData } = useContext(NotificationContext);

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dashboardId: number) =>
      DashboardReportsService.addReport({
        name: "New Report",
        description: "",
        dashboard_id: dashboardId,
        report_metadata: {
          width: DashboardReportWidth.HALF,
          time_range: {
            time_range_type: RelativeTimeRange.time_range_type.RELATIVE,
            time_interval: 60 * 60 * 24,
          },
          widget_type: DashboardWidgetType.COUNTER,
          configuration: convertToServerConfiguration(
            getDefaultReportConfiguration(
              ReportConfigurationType.ACTIVITY_IN_REGION
            )
          ),
        },
      }),
    onError: (e) => {
      setNotificationData({
        message: `Failed to create a Report`,
        severity: "error",
      });
      console.error(e);
    },
    onSuccess: async (_, dashboardId) => {
      await queryClient.invalidateQueries(["dashboard", dashboardId]);
    },
  });
}
