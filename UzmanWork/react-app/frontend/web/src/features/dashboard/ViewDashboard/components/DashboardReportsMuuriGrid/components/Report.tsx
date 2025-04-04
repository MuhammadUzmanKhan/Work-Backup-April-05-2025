import { useReportData, useSaveReport } from "features/dashboard/hooks";
import { ReportCard, ReportMenu, Widget } from "features/dashboard/components";
import { AbsoluteTimeRange, DashboardReport } from "features/dashboard/types";
import { RelativeTimeRange } from "coram-common-utils";
import { useScrollToReportOnRequest } from "./hooks";
import { useTheme } from "@mui/material";

export interface ReportProps {
  report: DashboardReport;
  onEdit: VoidFunction;
  onClone: () => Promise<void>;
  onDelete: () => Promise<void>;
  isScrolledRequested: boolean;
  onScrollEnd: VoidFunction;
}

export function Report({
  report,
  onEdit,
  onClone,
  onDelete,
  isScrolledRequested,
  onScrollEnd,
}: ReportProps) {
  const theme = useTheme();

  const { data, isSuccess } = useReportData(report.id);

  const { isLoading: isSaving, mutateAsync: saveReport } = useSaveReport();

  const { cardRef, isScrollInProgress } = useScrollToReportOnRequest(
    isScrolledRequested,
    onScrollEnd
  );

  async function handleTimeRangeChange(
    timeRange: AbsoluteTimeRange | RelativeTimeRange
  ) {
    await saveReport({
      ...report,
      report_metadata: { ...report.report_metadata, time_range: timeRange },
    });
  }

  return (
    <ReportCard
      reportName={report.name}
      reportDescription={report.description}
      reportTimeRange={report.report_metadata.time_range}
      onTimeRangeChange={handleTimeRangeChange}
      Menu={
        <ReportMenu onEdit={onEdit} onClone={onClone} onDelete={onDelete} />
      }
      borderColour={isScrollInProgress ? theme.palette.primary.main : undefined}
      ref={cardRef}
    >
      <Widget
        reportName={report.name}
        widgetType={report.report_metadata.widget_type}
        isDataReady={isSuccess && !isSaving}
        data={data}
      />
    </ReportCard>
  );
}
