import { Popover, Typography } from "@mui/material";
import {
  CameraPipelineAlertType,
  isDefined,
  DATE_WITH_TIME_AND_ZONE,
} from "coram-common-utils";
import { DateTime } from "luxon";
import Grid from "@mui/material/Unstable_Grid2";
import { alertTypeToShow } from "./utils";

interface StatusCellPopoverProps {
  open: boolean;
  anchorEl: Element | null;
  showDetailedCameraErrorsEnabled: boolean;
  shouldShowCameraAlert: boolean;
  alertType: CameraPipelineAlertType | undefined;
  alertDetails: string | undefined;
  lastSeenTime: DateTime | undefined | "Never";
  timezone: string;
}

export function StatusCellPopover({
  open,
  anchorEl,
  showDetailedCameraErrorsEnabled,
  shouldShowCameraAlert,
  alertType,
  alertDetails,
  lastSeenTime,
  timezone,
}: StatusCellPopoverProps) {
  const rows = [];

  if (shouldShowCameraAlert) {
    rows.push({
      title: "Alert:",
      description: alertTypeToShow(alertType, showDetailedCameraErrorsEnabled),
    });

    if (isDefined(alertDetails) && alertDetails !== "") {
      rows.push({
        title: "Details:",
        description: alertDetails,
      });
    }
  }

  if (isDefined(lastSeenTime)) {
    rows.push({
      title: "Last Online:",
      description:
        lastSeenTime === "Never"
          ? "Never"
          : lastSeenTime.setZone(timezone).toFormat(DATE_WITH_TIME_AND_ZONE),
    });
  }

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      sx={{ pointerEvents: "none" }}
      PaperProps={{ sx: { p: 2 } }}
    >
      {rows.map((row) => (
        <Grid key={row.title} container spacing={2} maxWidth={500}>
          <Grid xs={2}>
            <Typography variant="body2" color="textSecondary">
              {row.title}
            </Typography>
          </Grid>
          <Grid xs={10}>
            <Typography variant="body2">{row.description}</Typography>
          </Grid>
        </Grid>
      ))}
    </Popover>
  );
}
