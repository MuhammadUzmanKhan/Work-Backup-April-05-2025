import { useTheme } from "@mui/material";
import { InfoBox } from "./InfoBox";
import { CameraOffline as CameraOfflineIcon } from "icons/camera-offline";

// Box to show when the camera is disabled
export function DisabledBox({ backgroundImage }: { backgroundImage: string }) {
  const theme = useTheme();
  return (
    <InfoBox
      backgroundImage={backgroundImage}
      icon={<CameraOfflineIcon sx={{ color: theme.palette.common.white }} />}
      msg="Camera is disabled"
    />
  );
}
