import {
  ChangeHistory as ChangeHistoryIcon,
  ChangeHistoryTwoTone as ChangeHistoryTwoToneIcon,
} from "@mui/icons-material";
import { Box, Chip, Typography } from "@mui/material";
import { MouseEvent as MouseEventReact } from "react";

export const TRIAGE_ICON_WIDTH = 20;

const ICON_SX = {
  display: "block",
  position: "absolute",
  transform: "scale(-1)",
  translate: "-50%",
};

interface TriageControllerProps {
  isDragging: boolean;
  value: number;
  tooltipText: string;
  onMouseDown: (event: MouseEventReact) => void;
  onMouseMove: (event: MouseEventReact) => void;
  onMouseUp: (event: MouseEventReact) => void;
  iconWidth?: number;
}

export function TriageController({
  isDragging,
  value,
  tooltipText,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  iconWidth = TRIAGE_ICON_WIDTH,
}: TriageControllerProps) {
  const iconLeftPerc = `${value * 100}%`;
  const chipLeftPerc = `calc(${value * 100}% + ${TRIAGE_ICON_WIDTH / 2}px)`;

  return (
    <>
      {isDragging ? (
        <>
          <ChangeHistoryTwoToneIcon
            color="primary"
            sx={{ ...ICON_SX, width: iconWidth, height: iconWidth }}
            style={{
              left: iconLeftPerc,
            }}
          />
          <Chip
            label={<Typography variant="body2">{tooltipText}</Typography>}
            sx={{
              top: `-${TRIAGE_ICON_WIDTH / 2}px`,
              position: "absolute",
              zIndex: 2,
            }}
            style={{
              left: chipLeftPerc,
            }}
          />
        </>
      ) : (
        <ChangeHistoryIcon
          onMouseDown={onMouseDown}
          sx={{ ...ICON_SX, width: iconWidth, height: iconWidth }}
          style={{
            left: iconLeftPerc,
          }}
        />
      )}

      {isDragging && (
        <Box
          position="fixed"
          top="0"
          left="0"
          width="100%"
          height="100%"
          zIndex={1000}
          onMouseUp={onMouseUp}
          onMouseMove={onMouseMove}
        />
      )}
    </>
  );
}
