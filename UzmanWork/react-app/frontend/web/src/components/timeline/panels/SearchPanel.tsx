import {
  CreateOutlined as CreateOutlinedIcon,
  ImageOutlined as ImageOutlinedIcon,
  RectangleOutlined as RectangleOutlinedIcon,
} from "@mui/icons-material";
import {
  Box,
  CircularProgress,
  Divider,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useContext } from "react";
import {
  DrawingMode,
  DrawingStateContext,
  isDrawingStateContext,
} from "utils/drawing";
import { PanelHeader } from "../common_panel/PanelHeader";
import { PanelContent } from "../common_panel/PanelContent";
import {
  PanelContainer,
  PanelContainerProps,
} from "../common_panel/PanelContainer";
import { PanelSectionHeader } from "../common_panel/PanelSectionHeader";

const iconsStyles = {
  borderRadius: "25px",
  fontSize: "30px",
  padding: "5px",
  cursor: "pointer",
};

function setTextHint(drawingMode: DrawingMode) {
  switch (drawingMode) {
    case DrawingMode.Rectangle:
      return "Click and drag to draw a search area on the image.";
    case DrawingMode.Polygon:
      return "Click to draw a polygon on the image.";
    case DrawingMode.FullImage:
      return "The search area is the whole image.";
    default: {
      const _exhaustiveCheck: never = drawingMode;
      throw new Error(`Unhandled drawing mode: ${_exhaustiveCheck}`);
    }
  }
}

export interface SearchPanelProps {
  clearDrawings: () => void;
  isFetching: boolean;
  onCloseClick: () => void;
  containerProps?: PanelContainerProps;
}

export function SearchPanel({
  isFetching,
  onCloseClick,
  clearDrawings,
  containerProps,
}: SearchPanelProps) {
  const { drawingState, setDrawingState } = isDrawingStateContext(
    useContext(DrawingStateContext)
  );

  return (
    <PanelContainer {...containerProps}>
      <PanelHeader title="SEARCH" onCloseClick={onCloseClick} />
      <PanelContent sx={{ gap: 2 }}>
        <PanelSectionHeader title="Select Region" />
        <Stack direction="row" alignItems="center" columnGap="0.9rem">
          <Tooltip title="All image">
            <ImageOutlinedIcon
              onClick={() => {
                clearDrawings();
                setDrawingState((state) => ({
                  ...state,
                  drawingMode: DrawingMode.FullImage,
                }));
              }}
              sx={{
                color:
                  drawingState.drawingMode === DrawingMode.FullImage
                    ? "common.white"
                    : "neutral.1000",
                backgroundColor:
                  drawingState.drawingMode === DrawingMode.FullImage
                    ? "secondary.main"
                    : "neutral.200",
                ...iconsStyles,
              }}
            />
          </Tooltip>
          <Tooltip title="Rectangle">
            <RectangleOutlinedIcon
              onClick={() => {
                clearDrawings();
                setDrawingState((state) => ({
                  ...state,
                  drawingMode: DrawingMode.Rectangle,
                }));
              }}
              sx={{
                color:
                  drawingState.drawingMode === DrawingMode.Rectangle
                    ? "common.white"
                    : "neutral.1000",
                backgroundColor:
                  drawingState.drawingMode === DrawingMode.Rectangle
                    ? "secondary.main"
                    : "neutral.200",
                ...iconsStyles,
              }}
            />
          </Tooltip>

          {
            <Tooltip title="Polygon">
              <CreateOutlinedIcon
                onClick={() => {
                  clearDrawings();
                  setDrawingState((state) => ({
                    ...state,
                    drawingMode: DrawingMode.Polygon,
                  }));
                }}
                sx={{
                  color:
                    drawingState.drawingMode === DrawingMode.Polygon
                      ? "common.white"
                      : "neutral.1000",
                  backgroundColor:
                    drawingState.drawingMode === DrawingMode.Polygon
                      ? "secondary.main"
                      : "neutral.200",
                  ...iconsStyles,
                }}
              />
            </Tooltip>
          }
        </Stack>

        <Divider sx={{ width: "100%" }} />

        <Stack spacing={1}>
          <Typography variant="body2" sx={{ color: "neutral.1000" }}>
            {setTextHint(drawingState.drawingMode)}
          </Typography>
        </Stack>

        {isFetching ? (
          <Box display="flex" justifyContent="center">
            <CircularProgress sx={{ color: "neutral.1000" }} />
          </Box>
        ) : (
          <></>
        )}
      </PanelContent>
    </PanelContainer>
  );
}
