import { Ref, forwardRef } from "react";
import {
  VideoPlayer,
  VideoPlayerHandle,
  VideoPlayerProps,
} from "./VideoPlayer";
import { Box } from "@mui/material";
import { useIsMobile } from "components/layout/MobileOnly";

interface FixedSideVideoPlayerProps extends VideoPlayerProps {
  aspectRatio?: string;
  mobileWidth?: string;
  desktopWidth?: string;
}

export const FixedSizeVideoPlayer = forwardRef(function FixedSizeVideoPlayer(
  {
    aspectRatio = "16/9",
    mobileWidth = "100vw",
    desktopWidth = "60vw",
    ...rest
  }: FixedSideVideoPlayerProps,
  // Re-export the player ref so that the parent can access the player.
  ref: Ref<VideoPlayerHandle>
) {
  const isMobile = useIsMobile();

  return (
    //  This additional div is because flex does not work with aspectRatio
    <Box>
      <Box
        width={isMobile ? mobileWidth : desktopWidth}
        sx={{
          aspectRatio: aspectRatio,
        }}
      >
        <VideoPlayer ref={ref} {...rest} />
      </Box>
    </Box>
  );
});
