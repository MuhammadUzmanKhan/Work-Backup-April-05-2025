import { Stack, Typography } from "@mui/material";
import { NoReportDataAvailableIcon } from "./NoReportDataAvailableIcon";

export const NoReportDataAvailable = () => (
  <Stack alignItems="center" justifyContent="center" gap={2} height="100%">
    <NoReportDataAvailableIcon />
    <Stack alignItems="center" gap={1}>
      <Typography variant="h2">No data available</Typography>
      <Typography variant="body1">
        Change the time period or adjust the Report settings
      </Typography>
    </Stack>
  </Stack>
);
