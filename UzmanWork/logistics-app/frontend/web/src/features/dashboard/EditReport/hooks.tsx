import {
  convertToServerReport,
  DashboardReport,
} from "features/dashboard/types";
import { useQuery } from "react-query";
import { DashboardReportsService } from "coram-common-utils";

export function useReportDataPreview(report: DashboardReport) {
  return useQuery(
    [
      "dashboards_report_data_preview",
      report.id,
      report.report_metadata.widget_type,
    ],
    async () =>
      DashboardReportsService.getReportDataFromRequest(
        convertToServerReport(report)
      ),
    {
      refetchOnWindowFocus: false,
    }
  );
}
