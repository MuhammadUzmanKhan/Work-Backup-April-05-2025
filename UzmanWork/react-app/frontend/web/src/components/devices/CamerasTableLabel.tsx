import { Stack, Typography, Tooltip, Divider } from "@mui/material";
import { CameraResponse } from "coram-common-utils";

interface CamerasTableLabelProps {
  streams: CameraResponse[];
  onCamerasClick: () => void;
  onActiveCamerasClick: () => void;
  onOfflineCamerasClick: () => void;
}

export function CamerasTableLabel({
  streams,
  onCamerasClick,
  onActiveCamerasClick,
  onOfflineCamerasClick,
}: CamerasTableLabelProps) {
  const totalCameras = streams.length;
  const activeCameras = streams.filter(
    (stream) => stream.camera.is_online && stream.camera.is_enabled
  ).length;
  const offlineCameras = totalCameras - activeCameras;
  return (
    <Stack spacing={1} alignItems="start">
      <Typography
        variant="h2"
        onClick={onCamerasClick}
      >{`Cameras (${totalCameras})`}</Typography>
      <Stack direction="row" spacing={1}>
        <Tooltip title="Active cameras can be seen live in My Wall">
          <Typography
            variant="body2"
            onClick={onActiveCamerasClick}
          >{`${activeCameras} Active`}</Typography>
        </Tooltip>
        <Divider orientation="vertical" />
        <Tooltip title="Offline cameras can only be queried for old clips">
          <Typography
            variant="body2"
            onClick={onOfflineCamerasClick}
          >{`${offlineCameras} Offline`}</Typography>
        </Tooltip>
      </Stack>
    </Stack>
  );
}
