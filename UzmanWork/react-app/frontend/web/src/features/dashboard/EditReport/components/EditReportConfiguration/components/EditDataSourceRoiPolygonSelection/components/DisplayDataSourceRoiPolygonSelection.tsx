import { useContext, useRef } from "react";
import { useElementSizeFromEl } from "hooks/element_size";
import { DrawingStateContext, isDrawingStateContext } from "utils/drawing";
import { Box, Fade } from "@mui/material";
import { PolyDrawer } from "components/timeline/PolyDrawer";
import {
  isDefined,
  useFetchMostRecentThumbnailEnlarged,
} from "coram-common-utils";
import { Close as CloseIcon } from "@mui/icons-material";
import { CANVAS_Z_INDEX_FOREGROUND } from "components/video/VideoPlayer";
import { LoadingBox } from "components/video/LoadingBox";

interface DisplayDataSourceRoiPolygonSelectionProps {
  cameraMacAddress: string;
}

export function DisplayDataSourceRoiPolygonSelection({
  cameraMacAddress,
}: DisplayDataSourceRoiPolygonSelectionProps) {
  const thumbnailLocalURL = useFetchMostRecentThumbnailEnlarged({
    cameraMacAddress,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const { size: thumbnailSize } = useElementSizeFromEl(containerRef.current);

  const { drawingState, setDrawingState } = isDrawingStateContext(
    useContext(DrawingStateContext)
  );

  const thumbnailIsLoaded = isDefined(thumbnailLocalURL);

  return (
    <Box
      position="relative"
      boxSizing="border-box"
      width="100%"
      sx={{
        aspectRatio: "16/9",
      }}
    >
      {!thumbnailIsLoaded && <LoadingBox />}
      <Fade in={thumbnailIsLoaded} timeout={200}>
        <Box>
          <Box
            src={thumbnailLocalURL}
            component="img"
            display="block"
            width="100%"
            sx={{
              aspectRatio: "16/9",
            }}
            ref={containerRef}
          />
          <Box
            width="100%"
            height="100%"
            left={0}
            top={0}
            position="absolute"
            display="flex"
            justifyContent="center"
            alignItems="center"
            zIndex={1000}
            sx={{
              pointerEvents: "none",
            }}
          >
            <PolyDrawer videoSize={thumbnailSize} />
          </Box>
          {isDefined(drawingState.closeIconPosition) && (
            <CloseIcon
              sx={{
                zIndex: CANVAS_Z_INDEX_FOREGROUND,
                position: "absolute",
                top: drawingState.closeIconPosition.top + 5,
                right: drawingState.closeIconPosition.right - 27,
                cursor: "pointer",
                color: "common.white",
                borderRadius: "2rem",
                p: "4px",
                backgroundColor: "secondary.main",
              }}
              onClick={() => {
                setDrawingState((prev) => ({
                  ...prev,
                  rects: [],
                  polygons: [],
                  closeIconPosition: undefined,
                }));
              }}
            />
          )}
        </Box>
      </Fade>
    </Box>
  );
}
