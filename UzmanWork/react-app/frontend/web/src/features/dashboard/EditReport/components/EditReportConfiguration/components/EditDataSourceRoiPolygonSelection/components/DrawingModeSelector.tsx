import { DrawingMode } from "utils/drawing";
import {
  styled,
  ToggleButton,
  toggleButtonClasses,
  ToggleButtonGroup,
  toggleButtonGroupClasses,
  Tooltip,
} from "@mui/material";
import {
  Draw as DrawIcon,
  FullImage as FullImageIcon,
  Rectangle as RectangleIcon,
} from "icons";

interface DrawingModeSelectorProps {
  drawingMode: DrawingMode;
  setDrawingMode: (drawingMode: DrawingMode) => void;
}

export function DrawingModeSelector({
  drawingMode,
  setDrawingMode,
}: DrawingModeSelectorProps) {
  return (
    <StyledToggleButtonGroup
      size="small"
      value={drawingMode}
      exclusive
      onChange={(_, value) => {
        if (value === null) {
          return;
        }
        setDrawingMode(value);
      }}
    >
      <StyledToggleButton value={DrawingMode.FullImage}>
        <Tooltip title="Entire image">
          <FullImageIcon />
        </Tooltip>
      </StyledToggleButton>
      <StyledToggleButton value={DrawingMode.Rectangle}>
        <Tooltip title="Draw a rectangle region">
          <RectangleIcon />
        </Tooltip>
      </StyledToggleButton>
      <StyledToggleButton value={DrawingMode.Polygon}>
        <Tooltip title="Draw a polygon region">
          <DrawIcon />
        </Tooltip>
      </StyledToggleButton>
    </StyledToggleButtonGroup>
  );
}

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(() => ({
  [`&.${toggleButtonGroupClasses.root}`]: {
    backgroundColor: "transparent",
    border: 0,
  },
}));

const StyledToggleButton = styled(ToggleButton)(() => ({
  "--fill-color": "#E6EBF2",
  "--stroke-color": "#3C3E49",

  [`&.${toggleButtonClasses.root}`]: {
    backgroundColor: "transparent",
    border: 0,
    "&:hover": {
      backgroundColor: "transparent",
    },
  },
  [`&.${toggleButtonClasses.selected}`]: {
    backgroundColor: "transparent",
    "&:hover": {
      backgroundColor: "transparent",
    },
    "--fill-color": "#635DFF",
    "--stroke-color": "#E6EBF2",
  },
}));
