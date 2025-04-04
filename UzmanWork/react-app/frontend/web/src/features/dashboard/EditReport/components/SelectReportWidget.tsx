import { StyledSelect } from "components/styled_components/StyledSelect";
import {
  DashboardWidgetType,
  ReportConfigurationType,
} from "coram-common-utils";
import { MenuItem } from "@mui/material";
import { EditReportSection } from "./EditReportSection";

interface SelectReportWidgetProps {
  reportType: ReportConfigurationType;
  widgetType: DashboardWidgetType;
  onWidgetSelect: (widgetType: DashboardWidgetType) => void;
}

export function SelectReportWidget({
  reportType,
  widgetType,
  onWidgetSelect,
}: SelectReportWidgetProps) {
  const supportedWidgetTypes = REPORT_TYPE_TO_WIDGET_TYPES[reportType];

  return (
    <EditReportSection title="Report Visualisation">
      <StyledSelect
        fullWidth
        value={widgetType}
        onChange={(e) => onWidgetSelect(e.target.value as DashboardWidgetType)}
      >
        {supportedWidgetTypes.map((type) => (
          <MenuItem key={type} value={type}>
            {WIDGET_TYPE_TO_DISPLAY_NAME[type]}
          </MenuItem>
        ))}
      </StyledSelect>
    </EditReportSection>
  );
}

const REPORT_TYPE_TO_WIDGET_TYPES = {
  [ReportConfigurationType.ACTIVITY_IN_REGION]: [
    DashboardWidgetType.COUNTER,
    DashboardWidgetType.LINE_CHART,
    DashboardWidgetType.CLIPS,
  ],
  [ReportConfigurationType.LINE_CROSSING]: [
    DashboardWidgetType.COUNTER,
    DashboardWidgetType.LINE_CHART,
    DashboardWidgetType.CLIPS,
  ],
  [ReportConfigurationType.OBJECT_COUNT]: [
    DashboardWidgetType.COUNTER,
    DashboardWidgetType.LINE_CHART,
  ],
};

const WIDGET_TYPE_TO_DISPLAY_NAME = {
  [DashboardWidgetType.COUNTER]: "Event Counter",
  [DashboardWidgetType.LINE_CHART]: "Graphs",
  [DashboardWidgetType.CLIPS]: "Video Clips",
};
