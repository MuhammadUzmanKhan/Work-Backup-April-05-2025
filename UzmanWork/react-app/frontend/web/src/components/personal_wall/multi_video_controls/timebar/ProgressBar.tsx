import { KonvaContainer } from "components/zoom_free_timeline/KonvaContainer";
import { Stage, Layer, Rect } from "react-konva";
import { MouseEvent } from "react";

const BACKGROUND_COLOR = "lightgray";

interface BarData {
  value: number;
  color: string;
}

interface ProgressBarProps {
  values: BarData[];
  width: number;
  height: number;
  backgroundColor?: string;
  onClick: (ev: MouseEvent) => void;
  onMouseMove: (ev: MouseEvent) => void;
}

export function ProgressBar({
  values,
  width,
  height,
  backgroundColor = BACKGROUND_COLOR,
  onClick,
  onMouseMove,
}: ProgressBarProps) {
  return (
    <KonvaContainer onMouseMove={onMouseMove} onClick={onClick}>
      <Stage width={width} height={height}>
        <Layer>
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill={backgroundColor}
            cornerRadius={4}
          />
          {values.map(({ value, color }, index) => (
            <Rect
              key={index}
              x={0}
              y={0}
              width={value * width}
              height={height}
              fill={color}
              cornerRadius={4}
            />
          ))}
        </Layer>
      </Stage>
    </KonvaContainer>
  );
}
