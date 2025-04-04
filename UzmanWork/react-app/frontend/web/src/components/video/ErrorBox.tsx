import { useTheme } from "@mui/material";

import { InfoBox } from "./InfoBox";
import { CameraOffline as CameraOfflineIcon } from "icons/camera-offline";

interface ErrorBoxProps {
  errorMsg: string;
  backgroundImage: string;
}

// Box to show when the video cannot be played, e.g. when the video is not found
export function ErrorBox({ errorMsg, backgroundImage }: ErrorBoxProps) {
  // Mui theme
  const theme = useTheme();
  return (
    <InfoBox
      icon={
        <CameraOfflineIcon
          sx={{
            color: theme.palette.common.white,
          }}
        />
      }
      msg={errorMsg}
      backgroundImage={backgroundImage}
    />
  );
}
