import { OutPortal } from "react-reverse-portal";
import { ForwardedRef, forwardRef, useImperativeHandle, useRef } from "react";
import { Box, Fade, IconButton, Stack } from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { useFullScreenContext } from "../context";
import { isDefined } from "coram-common-utils";
import { useHideArrows, useKeyboardNavigation } from "./hooks";
import { findNextValidVideoId } from "./utils";

export const FullScreenVideoPanel = forwardRef<HTMLDivElement>(
  function FullScreenVideoPanel(_, forwardedRef: ForwardedRef<HTMLDivElement>) {
    const ref = useRef<HTMLDivElement>(null);
    useImperativeHandle(forwardedRef, () => ref.current as HTMLDivElement);

    const { activeFullScreenVideoId, setActiveFullScreenVideoId, portalNodes } =
      useFullScreenContext();

    const isFullScreen = isDefined(activeFullScreenVideoId);

    const activeVideoPortalNode = isDefined(activeFullScreenVideoId)
      ? portalNodes.get(activeFullScreenVideoId)
      : undefined;

    const enableSwitchingVideos =
      isDefined(activeFullScreenVideoId) &&
      ref.current === document.fullscreenElement;

    const { showArrows, resetHideTimer } = useHideArrows(enableSwitchingVideos);

    function handleSwitchVideoClick(direction: "next" | "previous") {
      if (!isDefined(activeFullScreenVideoId)) {
        return;
      }

      const nextVideo = findNextValidVideoId(
        portalNodes,
        activeFullScreenVideoId,
        direction
      );

      setActiveFullScreenVideoId(nextVideo);
      resetHideTimer();
    }

    useKeyboardNavigation(
      enableSwitchingVideos,
      () => handleSwitchVideoClick("next"),
      () => handleSwitchVideoClick("previous")
    );

    return (
      <Box display={isFullScreen ? "block" : "none"} ref={ref}>
        <Box
          position="absolute"
          width="100vw"
          height="100vh"
          onPointerDown={resetHideTimer}
        >
          <Stack
            width="100%"
            height="100%"
            direction="row"
            position="absolute"
            justifyContent="space-between"
            alignItems="center"
          >
            <Fade in={enableSwitchingVideos && showArrows} timeout={500}>
              <IconButton
                onClick={() => handleSwitchVideoClick("previous")}
                color="secondary"
                sx={{ zIndex: 1 }}
              >
                <ChevronLeftIcon sx={{ fontSize: "5rem" }} />
              </IconButton>
            </Fade>
            <Fade in={enableSwitchingVideos && showArrows} timeout={500}>
              <IconButton
                onClick={() => handleSwitchVideoClick("next")}
                color="secondary"
                sx={{ zIndex: 1 }}
              >
                <ChevronRightIcon sx={{ fontSize: "5rem" }} />
              </IconButton>
            </Fade>
          </Stack>
          {isDefined(activeVideoPortalNode) && (
            <OutPortal node={activeVideoPortalNode} />
          )}
        </Box>
      </Box>
    );
  }
);
