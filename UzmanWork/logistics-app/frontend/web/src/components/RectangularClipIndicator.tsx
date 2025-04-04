import { Group, Rect } from "react-konva";

interface RectangularClipIndicatorProps {
  startX: number;
  endX: number;
  height: number;
}

export function RectangularClipIndicator({
  startX,
  endX,
  height,
}: RectangularClipIndicatorProps) {
  return (
    <Group x={startX} y={0}>
      <Rect
        x={0}
        y={0}
        width={6}
        height={height}
        fill="#83889E"
        cornerRadius={[10, 0, 0, 10]}
        opacity={0.3}
      ></Rect>
      <Rect
        x={6}
        y={0}
        width={endX - 12}
        height={height}
        fill="#83889E"
        opacity={0.1}
      ></Rect>
      <Rect
        x={endX - 6}
        y={0}
        width={6}
        height={height}
        fill="#83889E"
        cornerRadius={[0, 10, 10, 0]}
        opacity={0.3}
      ></Rect>
    </Group>
  );
}
