import {
  SignalCellularAlt2BarOutlined as HalfBarsSignalIcon,
  SignalCellularAltOutlined as AllBarsSignalIcon,
} from "@mui/icons-material";
import { Link, Stack, Tooltip, Typography } from "@mui/material";
import {
  isDefined,
  InternetStatus,
  KvsCheckerResult,
  NvrKvsConnectionStatus,
} from "coram-common-utils";
import { REQUIRED_MIN_UPLOAD_SPEED_BPS } from "../consts";
import Grid from "@mui/material/Unstable_Grid2";
import { DateTime } from "luxon";
import { Alert as AlertIcon } from "icons";

interface OnlineStatusProps {
  internetStatus: InternetStatus | undefined;
  kvsConnectionStatus: NvrKvsConnectionStatus | undefined;
  timezone: string;
}

export function OnlineStatus({
  internetStatus,
  kvsConnectionStatus,
  timezone,
}: OnlineStatusProps) {
  const hasKVSConnectionIssues =
    isDefined(kvsConnectionStatus) &&
    kvsConnectionStatus.check_result !== KvsCheckerResult.KVS_CONNECTED;

  const isHighQualitySignal =
    isDefined(internetStatus) &&
    internetStatus.avg_ping_latency_ms < 50 &&
    internetStatus.packet_loss < 0.02 &&
    (!isDefined(internetStatus.internet_speed) ||
      internetStatus.internet_speed.upload_speed_bps >=
        REQUIRED_MIN_UPLOAD_SPEED_BPS);

  const ping =
    isDefined(internetStatus) && internetStatus.avg_ping_latency_ms >= 0
      ? `${Math.floor(internetStatus?.avg_ping_latency_ms)}ms`
      : undefined;

  const packetLoss =
    isDefined(internetStatus) && internetStatus.packet_loss >= 0
      ? `${Math.floor(internetStatus?.packet_loss * 100)}%`
      : undefined;

  const downloadSpeed = internetStatus?.internet_speed
    ? `${Math.floor(
        internetStatus.internet_speed.download_speed_bps / 1_000_000
      )} Mbps`
    : undefined;

  const uploadSpeed = internetStatus?.internet_speed
    ? `${Math.floor(
        internetStatus.internet_speed.upload_speed_bps / 1_000_000
      )} Mbps`
    : undefined;

  const measuredAt = internetStatus?.internet_speed
    ? DateTime.fromISO(internetStatus.internet_speed.timestamp, {
        zone: timezone,
      }).toFormat("MM/dd/yyyy hh:mm:ss a ZZZZ")
    : undefined;

  return (
    <Tooltip
      title={
        <Grid container spacing={0.7}>
          {isDefined(ping) && (
            <>
              <Grid xs={5} sx={{ textDecoration: "underline" }}>
                Ping
              </Grid>
              <Grid xs={7}>{ping}</Grid>
            </>
          )}
          {isDefined(packetLoss) && (
            <>
              <Grid xs={5} sx={{ textDecoration: "underline" }}>
                Packet Loss
              </Grid>
              <Grid xs={7}>{packetLoss}</Grid>
            </>
          )}
          {isDefined(internetStatus?.internet_speed) && (
            <Grid container spacing={0}>
              <Grid xs={12} sx={{ textDecoration: "underline" }}>
                Internet Speed
              </Grid>
              <Grid xs={5}>Download: </Grid>
              <Grid xs={7}>{downloadSpeed}</Grid>
              <Grid xs={5}>Upload: </Grid>
              <Grid xs={7}>{uploadSpeed}</Grid>
              <Grid xs={5}>Measured At: </Grid>
              <Grid xs={7}>{measuredAt}</Grid>
            </Grid>
          )}
          {hasKVSConnectionIssues && (
            <Grid container spacing={0}>
              <Grid xs={12} sx={{ textDecoration: "underline" }}>
                Errors
              </Grid>
              <Grid xs={12}>
                Firewall is blocking access to AWS (
                <Link
                  href="https://help.coram.ai/en/articles/9163711-firewall-settings-for-coram-point"
                  target="_blank"
                >
                  read more
                </Link>
                )
              </Grid>
            </Grid>
          )}
        </Grid>
      }
      PopperProps={{ sx: { minWidth: "320px", px: 1, py: 2 } }}
    >
      <Stack direction="row" alignItems="center" gap={1}>
        {hasKVSConnectionIssues ? (
          <AlertIcon fontSize="small" color="warning" />
        ) : isHighQualitySignal ? (
          <AllBarsSignalIcon fontSize="small" color="success" />
        ) : (
          <HalfBarsSignalIcon fontSize="small" color="warning" />
        )}
        <Typography variant="body2">Online</Typography>
      </Stack>
    </Tooltip>
  );
}
