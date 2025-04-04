import { EditDescription, EditName, EditReportType } from "./components";
import { Stack, Typography } from "@mui/material";
import { EditReportSection } from "../EditReportSection";
import {
  DashboardReport,
  DashboardReportMetadata,
} from "features/dashboard/types";
import { ReportTimeRangeSelector } from "features/dashboard/components";
import { DateRange as DateRangeIcon } from "@mui/icons-material";
import { getDefaultReportConfiguration } from "features/dashboard/utils";
import { DashboardWidgetType } from "coram-common-utils";

interface EditReportDetailsProps {
  editedReportState: DashboardReport;
  onUpdateReport: (update: Partial<DashboardReport>) => void;
  onUpdateReportMetadata: (update: Partial<DashboardReportMetadata>) => void;
}

export function EditReportDetails({
  editedReportState,
  onUpdateReport,
  onUpdateReportMetadata,
}: EditReportDetailsProps) {
  return (
    <EditReportSection title="Report Details">
      <EditName
        name={editedReportState.name}
        setName={(name) => onUpdateReport({ ...editedReportState, name })}
      />
      <EditDescription
        description={editedReportState.description ?? ""}
        setDescription={(description) =>
          onUpdateReport({ ...editedReportState, description })
        }
      />
      <Stack direction="column" gap={1}>
        <Typography variant="body1" color="#83889E">
          Time period
        </Typography>
        <ReportTimeRangeSelector
          initialTimeRange={editedReportState.report_metadata.time_range}
          onTimeRangeChange={(time_range) =>
            onUpdateReportMetadata({ time_range })
          }
          Icon={DateRangeIcon}
        />
      </Stack>
      <EditReportType
        reportType={editedReportState.report_metadata.configuration.report_type}
        onReportTypeChange={(reportType) =>
          onUpdateReportMetadata({
            widget_type: DashboardWidgetType.COUNTER,
            configuration: {
              ...getDefaultReportConfiguration(reportType),
              report_type: reportType,
            },
          })
        }
      />
    </EditReportSection>
  );
}
