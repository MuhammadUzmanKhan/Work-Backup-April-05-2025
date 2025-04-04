import { MenuItem, Stack, Typography } from "@mui/material";
import { StyledSelect } from "components/styled_components/StyledSelect";
import { ReportConfigurationType } from "coram-common-utils";

interface EditReportTypeProps {
  reportType: ReportConfigurationType | undefined;
  onReportTypeChange: (reportType: ReportConfigurationType) => void;
}

export function EditReportType({
  reportType,
  onReportTypeChange,
}: EditReportTypeProps) {
  return (
    <Stack gap={1}>
      <Typography variant="body1" color="#83889E">
        Report type
      </Typography>
      <StyledSelect
        fullWidth
        displayEmpty
        value={reportType}
        onChange={(e) => {
          const reportType = e.target.value as ReportConfigurationType;
          onReportTypeChange(reportType);
        }}
      >
        <MenuItem value={ReportConfigurationType.ACTIVITY_IN_REGION}>
          Activity in a Region
        </MenuItem>
        <MenuItem value={ReportConfigurationType.LINE_CROSSING}>
          Line Crossing
        </MenuItem>
        <MenuItem value={ReportConfigurationType.OBJECT_COUNT}>
          Object Count
        </MenuItem>
      </StyledSelect>
    </Stack>
  );
}
