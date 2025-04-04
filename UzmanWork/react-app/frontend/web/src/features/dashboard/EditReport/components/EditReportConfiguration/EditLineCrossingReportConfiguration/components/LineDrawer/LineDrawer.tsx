import { Arrow, Group, Layer, Line as KonvaLine, Stage } from "react-konva";
import { isDefined, LineCrossingDirection } from "coram-common-utils";
import Konva from "konva";
import { useState } from "react";
import { ClearLineDrawingButton } from "./ClearLineDrawingButton";
import {
  ArrowDirection,
  getArrowPoints,
  getClearButtonPosition,
  normaliseVector,
  scaleLine,
  scaleVector,
  vectorToArray,
} from "./utils";
import { Line } from "./types";
import { useTheme } from "@mui/material";

type LineDrawerState =
  | { type: "idle" }
  | {
      type: "drawingStarted";
      start: Konva.Vector2d;
    }
  | {
      type: "drawing";
      line: Line;
    }
  | {
      type: "drawn";
      line: Line;
      clearButtonPosition: Konva.Vector2d;
    };

interface LineDrawerProps {
  width: number;
  height: number;
  initialLine: Line | undefined;
  lineDirection: LineCrossingDirection;
  onLineChange: (line: Line) => void;
  onCursorChange: (cursor: string) => void;
}

export function LineDrawer({
  width,
  height,
  lineDirection,
  initialLine,
  onLineChange,
  onCursorChange,
}: LineDrawerProps) {
  const theme = useTheme();

  const [state, setState] = useState<LineDrawerState>(() => {
    if (isDefined(initialLine)) {
      return {
        type: "drawn",
        line: initialLine,
        clearButtonPosition: getClearButtonPosition(initialLine),
      };
    }
    return { type: "idle" };
  });

  function handleMouseDown(event: Konva.KonvaEventObject<MouseEvent>) {
    const stage = event.target.getStage();
    const pointerPosition = stage?.getPointerPosition();
    if (state.type !== "idle" || !pointerPosition) {
      return;
    }

    const normalisedStart = normaliseVector(pointerPosition, width, height);
    setState({ type: "drawingStarted", start: normalisedStart });
  }

  function handleMouseMove(event: Konva.KonvaEventObject<MouseEvent>) {
    if (state.type === "drawingStarted" || state.type === "drawing") {
      const stage = event.target.getStage();
      const pointerPosition = stage?.getPointerPosition();
      if (!isDefined(pointerPosition)) {
        return;
      }

      const start =
        state.type === "drawingStarted" ? state.start : state.line.start;
      const end = normaliseVector(pointerPosition, width, height);

      const { x: startX, y: startY } = start;
      const { x: endX, y: endY } = end;

      const distance = Math.sqrt(
        Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
      );

      if (distance > 0.01) {
        setState({
          type: "drawing",
          line: {
            start: start,
            end: end,
          },
        });
      }
    }
  }

  function handleMouseUp() {
    if (state.type !== "drawing") {
      return;
    }

    setState({
      ...state,
      type: "drawn",
      clearButtonPosition: getClearButtonPosition(state.line),
    });

    onLineChange(state.line);
    onCursorChange("default");
  }

  function handleClearLine() {
    setState({ type: "idle" });
    onCursorChange("crosshair");
  }

  function handleStageMouseEnter() {
    if (state.type !== "idle") {
      onCursorChange("default");
    } else {
      onCursorChange("crosshair");
    }
  }

  const displayLine = state.type === "drawing" || state.type === "drawn";
  return (
    <Stage
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMousemove={handleMouseMove}
      onMouseup={handleMouseUp}
      onMouseEnter={handleStageMouseEnter}
    >
      <Layer>
        {displayLine && (
          <Group>
            <KonvaLine
              points={[
                ...vectorToArray(scaleVector(state.line.start, width, height)),
                ...vectorToArray(scaleVector(state.line.end, width, height)),
              ]}
              stroke={theme.palette.secondary.main}
              strokeWidth={4}
            />
            {[LineCrossingDirection.BOTH, LineCrossingDirection.LEFT].includes(
              lineDirection
            ) && (
              <Arrow
                points={getArrowPoints({
                  line: scaleLine(state.line, width, height),
                  direction: ArrowDirection.Left,
                  width,
                  height,
                })}
                pointerLength={7}
                pointerWidth={6}
                fill={theme.palette.secondary.main}
                stroke={theme.palette.secondary.main}
                strokeWidth={2.5}
              />
            )}
            {[LineCrossingDirection.BOTH, LineCrossingDirection.RIGHT].includes(
              lineDirection
            ) && (
              <Arrow
                points={getArrowPoints({
                  line: scaleLine(state.line, width, height),
                  direction: ArrowDirection.Right,
                  width,
                  height,
                })}
                pointerLength={7}
                pointerWidth={6}
                fill={theme.palette.secondary.main}
                stroke={theme.palette.secondary.main}
                strokeWidth={2.5}
              />
            )}
          </Group>
        )}
        {state.type === "drawn" && (
          <ClearLineDrawingButton
            position={scaleVector(state.clearButtonPosition, width, height)}
            onClick={handleClearLine}
            onMouseEnter={() => onCursorChange("pointer")}
            onMouseLeave={() => onCursorChange("default")}
          />
        )}
      </Layer>
    </Stage>
  );
}
