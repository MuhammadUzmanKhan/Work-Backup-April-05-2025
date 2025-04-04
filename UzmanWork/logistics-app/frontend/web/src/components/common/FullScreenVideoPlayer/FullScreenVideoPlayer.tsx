import {
  VideoPlayer as DefaultVideoPlayer,
  VideoPlayerProps,
} from "components/video/VideoPlayer";
import { ComponentType, useEffect, useMemo } from "react";
import { useFullScreenContext } from "./context";
import {
  createHtmlPortalNode,
  InPortal,
  OutPortal,
} from "react-reverse-portal";
import { Box } from "@mui/material";

interface FullScreenVideoProps extends VideoPlayerProps {
  id: number;
  VideoPlayer?: ComponentType<VideoPlayerProps>;
}

/**
 * `VideoPlayerWithPortal` is a wrapper for `VideoPlayer` leveraging `react-reverse-portal` for flexible rendering. It
 * supports two modes:
 *
 * 1. With `renderInPortal` true, it renders `VideoPlayer` in a `FullScreenVideoPanel` through a portal, allowing fullscreen
 *    outside its original DOM context.
 * 2. With `renderInPortal` false, it renders `VideoPlayer` directly in its original location.
 *
 * This utilizes `InPortal` and `OutPortal` for moving `VideoPlayer` between DOM locations and maintaining its state.
 */
export function FullScreenVideoPlayer({
  id,
  VideoPlayer = DefaultVideoPlayer,
  videoPlayerContainerSx,
  ...rest
}: FullScreenVideoProps) {
  const { activeFullScreenVideoId, setPortalNodes, toggleFullScreen } =
    useFullScreenContext();

  const renderInFullscreen = activeFullScreenVideoId === id;

  const portalNode = useMemo(
    () =>
      createHtmlPortalNode({
        attributes: {
          style: "height: 100%; width: 100%;",
        },
      }),
    []
  );

  useEffect(() => {
    setPortalNodes((prev) => new Map(prev).set(id, portalNode));
    return () => {
      setPortalNodes((prev) => {
        const newPortalNodes = new Map(prev);
        newPortalNodes.delete(id);
        return newPortalNodes;
      });
    };
  }, [portalNode, id, setPortalNodes]);

  return (
    <Box sx={videoPlayerContainerSx}>
      <InPortal node={portalNode}>
        <VideoPlayer
          {...rest}
          onToggleFullScreen={() => toggleFullScreen(id)}
          alwaysShowControls={renderInFullscreen}
        />
      </InPortal>
      {!renderInFullscreen && <OutPortal node={portalNode} />}
    </Box>
  );
}
