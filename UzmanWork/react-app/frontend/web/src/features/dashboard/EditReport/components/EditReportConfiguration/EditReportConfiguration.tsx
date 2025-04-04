import { EditReportSection } from "../EditReportSection";
import { ReportConfiguration } from "features/dashboard/types";
import { EditReportConfigurationProps } from "./types";
import { getEditReportConfigurationComponent } from "./utils";

export function EditReportConfiguration(
  props: EditReportConfigurationProps<ReportConfiguration>
) {
  return (
    <EditReportSection title="Configure Report">
      {getEditReportConfigurationComponent(props)}
    </EditReportSection>
  );
}
