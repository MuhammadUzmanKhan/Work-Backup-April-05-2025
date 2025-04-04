import {
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useRecentCameraPipelineAlerts } from "features/devices/hooks";
import { formatDateTime, getUserFacingDescription } from "./utils";
import { CopyErrorsButton, NoRecentErrorsIcon } from "./components";
import { useCamerasTimezones } from "coram-common-utils";

interface RecentErrorsTabProps {
  cameraMacAddress: string;
}

export function RecentErrorsTab({ cameraMacAddress }: RecentErrorsTabProps) {
  const { data: recentCameraPipelineAlerts, isSuccess } =
    useRecentCameraPipelineAlerts(cameraMacAddress);

  const camerasTimezones = useCamerasTimezones({});

  if (!isSuccess) {
    return (
      <Stack alignItems="center" justifyContent="center" height="300px">
        <CircularProgress size={45} color="secondary" />
      </Stack>
    );
  }

  const sortedRecentCameraPipelineAlerts = recentCameraPipelineAlerts.sort(
    (a, b) => b.time_generated.toMillis() - a.time_generated.toMillis()
  );

  return sortedRecentCameraPipelineAlerts.length > 0 ? (
    <TableContainer component={Paper} sx={{ height: "100%" }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell width="20%">Date</TableCell>
            <TableCell width="20%">Error</TableCell>
            <TableCell>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                Description
                <CopyErrorsButton
                  alerts={sortedRecentCameraPipelineAlerts}
                  camerasTimezones={camerasTimezones}
                />
              </Stack>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody
          sx={{
            height: "100%",
            overflowY: "auto",
          }}
        >
          {sortedRecentCameraPipelineAlerts.map(
            ({ camera_mac_address, time_generated, alert_type }) => (
              <TableRow key={`${camera_mac_address}_${time_generated.toISO()}`}>
                <TableCell>
                  {formatDateTime(
                    time_generated,
                    camerasTimezones.get(camera_mac_address)
                  )}
                </TableCell>
                <TableCell>{alert_type}</TableCell>
                <TableCell>{getUserFacingDescription(alert_type)}</TableCell>
              </TableRow>
            )
          )}
        </TableBody>
      </Table>
    </TableContainer>
  ) : (
    <Stack alignItems="center" justifyContent="center" height="300px" gap={2}>
      <NoRecentErrorsIcon />
      <Typography variant="h2">No recent errors</Typography>
    </Stack>
  );
}
