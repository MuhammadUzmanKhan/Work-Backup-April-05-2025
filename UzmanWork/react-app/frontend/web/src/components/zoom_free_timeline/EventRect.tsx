import { useState } from "react";
import { Rect } from "react-konva";
import { DetectionAggregatedInterval } from "utils/detection_aggregation";

interface EventRectProps {
  detection: DetectionAggregatedInterval;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  onMouseEnter?: (info: DetectionAggregatedInterval) => void;
  onMouseLeave?: (info: DetectionAggregatedInterval) => void;
}

export function EventRect({
  detection,
  x,
  y,
  width,
  height,
  fill,
  onMouseEnter,
  onMouseLeave,
}: EventRectProps) {
  const [hover, setHover] = useState(false);
  return (
    <Rect
      onMouseEnter={() => {
        setHover(true);
        if (onMouseEnter) {
          onMouseEnter(detection);
        }
      }}
      onMouseLeave={() => {
        setHover(false);
        if (onMouseLeave) {
          onMouseLeave(detection);
        }
      }}
      x={x}
      y={y}
      width={width}
      height={height}
      opacity={hover ? 0.5 : 1}
      fill={fill}
    />
  );
}
