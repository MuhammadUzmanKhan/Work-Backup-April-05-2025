import { Box, keyframes } from "@mui/material";
import {
  PlayArrow as PlayIcon,
  PauseOutlined as PauseIcon,
} from "@mui/icons-material";
import { ElementSize } from "hooks/element_size";

type VideoPlaybackState = "loading" | "playing" | "paused";

// percentage for icon size relative to parent container
const ICON_BOX_PERCENTAGE = 0.06;
const ICON_SIZE_PERCENTAGE = 0.05;

const pulseAnimation = keyframes({
  "0%": {
    transform: "scale(1)",
  },
  "90%": {
    transform: "scale(2.25)",
  },
  "100%": {
    opacity: 0,
  },
});

export function VideoOverlayIcon({
  videoState,
  videoElementSize,
}: {
  videoState: VideoPlaybackState;
  videoElementSize: ElementSize;
}) {
  let icon = null;
  const iconBoxSize = `${videoElementSize.width * ICON_BOX_PERCENTAGE}px`;
  const iconSize = `${videoElementSize.width * ICON_SIZE_PERCENTAGE}px`;

  switch (videoState) {
    case "playing":
      icon = (
        <PlayIcon
          sx={{
            color: "common.white",
            fontSize: iconSize,
          }}
        />
      );
      break;
    case "paused":
      icon = (
        <PauseIcon
          sx={{
            color: "common.white",
            fontSize: iconSize,
          }}
        />
      );
      break;
    case "loading":
      icon = (
        <PlayIcon
          sx={{
            color: "common.white",
            fontSize: iconSize,
          }}
        />
      );
      break;
    default: {
      const _exhaustiveCheck: never = videoState;
      throw new Error(`Unhandled video state: ${_exhaustiveCheck}`);
    }
  }
  return (
    <Box
      key={videoState}
      sx={{
        width: iconBoxSize,
        height: iconBoxSize,
        backdropFilter: "brightness(0.3)",
        borderRadius: "50%",
        animation: `${pulseAnimation} 1s 1`,
        animationFillMode: "forwards",
        transition: "transform 0.5s ease-in-out",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {icon}
    </Box>
  );
}
