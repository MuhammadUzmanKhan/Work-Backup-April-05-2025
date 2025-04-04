import { DrawerWithHeader } from "components/common";
import {
  CameraResponse,
  NVRResponse,
  isDefined,
  DEFAULT_TIMEZONE,
} from "coram-common-utils";
import { Divider, Stack, Tooltip, Typography } from "@mui/material";
import { NVRNetworkInfo } from "./components";
import Grid from "@mui/material/Unstable_Grid2";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { green, grey } from "@mui/material/colors";

interface NVRDetailsDrawerProps {
  nvr: NVRResponse;
  nvrCameras: CameraResponse[];
  open: boolean;
  onClose: VoidFunction;
  refetchNvrs: () => Promise<unknown>;
}

export function NVRDetailsDrawer({
  nvr,
  nvrCameras,
  open,
  onClose,
}: NVRDetailsDrawerProps) {
  const activeCameras = nvrCameras.filter(
    (camera) => camera.camera.is_online && camera.camera.is_enabled
  ).length;

  const offlineCameras = nvrCameras.length - activeCameras;

  const networkInfo = nvr.nvr_info?.network_info;

  return (
    <DrawerWithHeader
      title="CVR Details"
      open={open}
      onClose={onClose}
      width="28rem"
    >
      <Stack gap={2} pt={1}>
        <Typography variant="h2" display="flex" gap={1} alignItems="center">
          <Tooltip title={nvr.is_online ? "Online" : "Offline"}>
            <FiberManualRecordIcon
              sx={{
                color: nvr.is_online ? green[500] : grey[400],
                fontSize: "1rem",
              }}
            />
          </Tooltip>
          {nvr.uuid}
        </Typography>
        {isDefined(networkInfo) && (
          <NVRNetworkInfo
            isNvrOnline={nvr.is_online}
            networkInfo={networkInfo}
            nvrTimezone={nvr.timezone ?? DEFAULT_TIMEZONE}
          />
        )}
        <Divider sx={{ width: "100%" }} />
        <Grid container spacing={2} width="100%" m={0}>
          <Grid xs={12}>
            <Typography variant="h3">Other Details</Typography>
          </Grid>
          <Grid xs={6}>
            <Typography variant="body1" color="textSecondary">
              Active Cameras
            </Typography>
          </Grid>
          <Grid xs={6} display="flex" justifyContent="end">
            <Typography variant="body1">{activeCameras}</Typography>
          </Grid>
          <Grid xs={6}>
            <Typography variant="body1" color="textSecondary">
              Offline Cameras
            </Typography>
          </Grid>
          <Grid xs={6} display="flex" justifyContent="end">
            <Typography variant="body1">{offlineCameras}</Typography>
          </Grid>
          <Grid xs={6}>
            <Typography variant="body1" color="textSecondary">
              Max Number of Cameras
            </Typography>
          </Grid>
          <Grid xs={6} display="flex" justifyContent="end">
            <Typography variant="body1">{nvr.max_cameras_slots}</Typography>
          </Grid>
        </Grid>
      </Stack>
    </DrawerWithHeader>
  );
}
