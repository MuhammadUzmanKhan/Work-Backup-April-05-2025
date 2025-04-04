import { RectangularClipIndicator } from "components/RectangularClipIndicator";
import { VisiblePortion, computeRatio } from "./utils";
import { Line } from "react-konva";

export interface Annotation {
  visible: boolean;
  offsetStart: number;
  offsetEnd: number;
  offsetCurrent: number;
}

interface AnnotationMarkProps {
  visiblePortion: VisiblePortion;
  annotation: Annotation;
  width: number;
  height: number;
}

export function AnnotationMark({
  visiblePortion,
  annotation,
  width,
  height,
}: AnnotationMarkProps) {
  const startX = computeRatio(annotation.offsetStart, visiblePortion) * width;
  const endX =
    computeRatio(annotation.offsetEnd, visiblePortion) * width - startX;
  const currentX =
    computeRatio(annotation.offsetCurrent, visiblePortion) * width;
  return (
    <>
      <RectangularClipIndicator startX={startX} endX={endX} height={height} />
      <Line
        points={[currentX, 0, currentX, height]}
        stroke="red"
        strokeWidth={1}
        dash={[3, 3]}
      />
    </>
  );
}
