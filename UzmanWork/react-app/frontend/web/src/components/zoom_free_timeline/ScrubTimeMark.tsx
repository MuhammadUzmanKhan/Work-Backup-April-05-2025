import { Group } from "react-konva";
import { TimeMark } from "./TimeMark";

interface ScrubTimeMarkProps {
  height: number;
  containerWidth: number;
  pointerOffset: number;
  strokeWidth: number;
}

export function ScrubTimeMark({
  height,
  containerWidth,
  pointerOffset,
  strokeWidth,
}: ScrubTimeMarkProps) {
  return (
    <Group>
      <TimeMark
        y={0}
        height={height}
        containerWidth={containerWidth}
        pointerOffset={pointerOffset}
        strokeWidth={strokeWidth}
      />
    </Group>
  );
}
