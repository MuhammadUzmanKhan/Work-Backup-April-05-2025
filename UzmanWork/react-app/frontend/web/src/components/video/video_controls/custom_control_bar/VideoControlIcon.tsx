import { VideoState } from "./utils";
import { ReplayRounded as ReplayRoundedIcon } from "@mui/icons-material";
import { PauseIcon } from "icons/pause-icon";
import { PlayIcon } from "icons/play-icon";
import { ActionButton } from "components/styled_components/ActionButton";
import { Box } from "@mui/material";

interface VideoControlIconProps {
  videoState: VideoState;
  videoElement: HTMLMediaElement;
}

export function VideoControlIcon({
  videoState,
  videoElement,
}: VideoControlIconProps) {
  let icon = null;
  switch (videoState) {
    case VideoState.Playing:
      icon = (
        <ActionButton onClick={() => videoElement.pause()}>
          <PauseIcon />
        </ActionButton>
      );
      break;
    case VideoState.Paused:
      icon = (
        <ActionButton onClick={() => videoElement.play()}>
          <PlayIcon />
        </ActionButton>
      );
      break;
    case VideoState.Ended:
      icon = (
        <ActionButton
          onClick={() => {
            videoElement.currentTime = 0;
            videoElement.play();
          }}
          sx={{ color: "common.white" }}
        >
          <ReplayRoundedIcon />
        </ActionButton>
      );
      break;
    case VideoState.Unavailable:
      icon = (
        <ActionButton disabled>
          <PlayIcon />
        </ActionButton>
      );
      break;
    default: {
      const _exhaustiveCheck: never = videoState;
      throw new Error(`Unhandled video state: ${_exhaustiveCheck}`);
    }
  }
  return <Box sx={{ minWidth: "1.5rem" }}>{icon}</Box>;
}
