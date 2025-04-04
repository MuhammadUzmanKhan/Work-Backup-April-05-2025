import { Line } from "react-konva";

interface TimeMarkProps {
  y: number;
  height: number;
  containerWidth: number;
  pointerOffset: number;
  strokeWidth: number;
}

export function TimeMark({
  y,
  height,
  containerWidth,
  pointerOffset,
  strokeWidth,
}: TimeMarkProps) {
  const positionX = pointerOffset * containerWidth;
  return (
    <Line
      points={[positionX, y, positionX, y + height]}
      dash={[3, 3]}
      stroke="gray"
      strokeWidth={strokeWidth}
    />
  );
}
