import { SignalCellularAltOutlined as AllBarsSignalIcon } from "@mui/icons-material";
import { Stack, Tooltip, Typography } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { isDefined } from "coram-common-utils";
import { DateTime } from "luxon";

interface OfflineStatusProps {
  lastSeenTime: string | undefined;
  timezone: string;
}

export function OfflineStatus({ lastSeenTime, timezone }: OfflineStatusProps) {
  return (
    <Tooltip
      title={
        <Grid container spacing={0.7}>
          <Grid xs={5} sx={{ textDecoration: "underline" }}>
            Last Online:
          </Grid>
          <Grid xs={7}>
            {isDefined(lastSeenTime)
              ? DateTime.fromISO(lastSeenTime, { zone: timezone }).toFormat(
                  "MM/dd/yyyy hh:mm:ss a ZZZZ"
                )
              : "Never"}
          </Grid>
        </Grid>
      }
      PopperProps={{ sx: { minWidth: "320px", px: 1, py: 2 } }}
    >
      <Stack direction="row" alignItems="center" gap={1}>
        <AllBarsSignalIcon fontSize="small" color="disabled" />
        <Typography variant="body2">Offline</Typography>
      </Stack>
    </Tooltip>
  );
}
