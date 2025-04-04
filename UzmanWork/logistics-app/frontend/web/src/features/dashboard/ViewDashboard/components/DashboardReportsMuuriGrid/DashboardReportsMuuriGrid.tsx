import { DashboardReport } from "features/dashboard/types";
import { MuuriGrid, MuuriGridItem } from "components/common";
import { Report } from "./components";

interface DashboardReportsMuuriGridProps {
  reports: DashboardReport[];
  onEditReport: (report: DashboardReport) => void;
  onCloneReport: (report: DashboardReport) => Promise<void>;
  onDeleteReport: (report: DashboardReport) => Promise<void>;
  onReportReorder: (newOrder: number[]) => Promise<void>;
  scrollToReportId: number | undefined;
  onScrollEnd: VoidFunction;
}

export function DashboardReportsMuuriGrid({
  reports,
  onEditReport,
  onCloneReport,
  onDeleteReport,
  onReportReorder,
  scrollToReportId,
  onScrollEnd,
}: DashboardReportsMuuriGridProps) {
  return (
    <MuuriGrid
      onItemsReordered={async (newOrder) =>
        onReportReorder(newOrder.map((item) => parseInt(item, 10)))
      }
    >
      {reports.map((report) => (
        <MuuriGridItem
          key={report.id}
          id={String(report.id)}
          width={report.report_metadata.width}
        >
          <Report
            report={report}
            onEdit={() => onEditReport(report)}
            onClone={() => onCloneReport(report)}
            onDelete={() => onDeleteReport(report)}
            isScrolledRequested={report.id === scrollToReportId}
            onScrollEnd={onScrollEnd}
          />
        </MuuriGridItem>
      ))}
    </MuuriGrid>
  );
}
