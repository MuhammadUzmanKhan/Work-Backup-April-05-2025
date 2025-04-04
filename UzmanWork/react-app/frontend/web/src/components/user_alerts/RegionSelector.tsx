import {
  CheckBoxOutlineBlankOutlined as CheckBoxOutlineBlankOutlinedIcon,
  CreateOutlined as CreateOutlinedIcon,
  ImageOutlined as ImageOutlinedIcon,
} from "@mui/icons-material";
import type { SxProps } from "@mui/material";
import { Tooltip } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2"; // Grid v2
import { useContext } from "react";
import {
  DrawingMode,
  DrawingStateContext,
  isDrawingStateContext,
} from "utils/drawing";

interface RegionSelectorProps {
  readonly?: boolean;
  iconColors: (selected: boolean) => SxProps;
}

const iconsStyles = {
  borderRadius: "25px",
  fontSize: "27px",
  padding: "4px",
  marginRight: "5px",
  marginY: "5px",
  cursor: "pointer",
};

export function RegionSelector({ readonly, iconColors }: RegionSelectorProps) {
  const { drawingState, setDrawingState } = isDrawingStateContext(
    useContext(DrawingStateContext)
  );
  return (
    <Grid container direction="row" alignItems="center" py={1} spacing={1}>
      <Grid>
        <Tooltip title="Entire image">
          <ImageOutlinedIcon
            sx={{
              ...iconColors(drawingState.drawingMode === DrawingMode.FullImage),
              ...iconsStyles,
            }}
            onClick={() => {
              if (!readonly) {
                setDrawingState((state) => ({
                  ...state,
                  rects: [],
                  polygons: [],
                  drawingMode: DrawingMode.FullImage,
                  closeIconPosition: undefined,
                }));
              }
            }}
          />
        </Tooltip>
      </Grid>
      <Grid>
        <Tooltip title="Draw on the video to select a region.">
          <CheckBoxOutlineBlankOutlinedIcon
            sx={{
              ...iconColors(drawingState.drawingMode === DrawingMode.Rectangle),
              ...iconsStyles,
            }}
            onClick={() => {
              if (!readonly) {
                setDrawingState((state) => ({
                  ...state,
                  rects: [],
                  polygons: [],
                  drawingMode: DrawingMode.Rectangle,
                  closeIconPosition: undefined,
                }));
              }
            }}
          />
        </Tooltip>
      </Grid>
      <Grid>
        <Tooltip title="Draw a polygon on the video.">
          <CreateOutlinedIcon
            sx={{
              ...iconColors(drawingState.drawingMode === DrawingMode.Polygon),
              ...iconsStyles,
            }}
            onClick={() => {
              if (!readonly) {
                setDrawingState((state) => ({
                  ...state,
                  rects: [],
                  polygons: [],
                  drawingMode: DrawingMode.Polygon,
                  closeIconPosition: undefined,
                }));
              }
            }}
          />
        </Tooltip>
      </Grid>
    </Grid>
  );
}
