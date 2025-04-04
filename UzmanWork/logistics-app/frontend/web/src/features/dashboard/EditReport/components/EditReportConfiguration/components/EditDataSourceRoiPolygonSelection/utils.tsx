import { CameraDataSourceWithROI } from "coram-common-utils";
import {
  arrayToVector,
  DrawingMode,
  DrawingState,
  INITIAL_DRAWING_STATE,
  isFullImageRectangle,
  isRectangle,
  polygonToDrawRect,
  SimplePolygon,
} from "utils/drawing";

export function getDrawingStateFromDataSource(
  dataSource: CameraDataSourceWithROI
) {
  let drawingState: DrawingState = { ...INITIAL_DRAWING_STATE };

  if (dataSource.roi_polygon.length > 0) {
    const roi: SimplePolygon = dataSource.roi_polygon.map(arrayToVector);
    if (isRectangle(roi)) {
      const isFullImage = isFullImageRectangle(roi);
      if (!isFullImage) {
        drawingState = {
          drawingMode: DrawingMode.Rectangle,
          rects: [polygonToDrawRect(roi)],
          polygons: [],
        };
      }
    } else {
      drawingState = {
        drawingMode: DrawingMode.Polygon,
        polygons: [roi],
        rects: [],
      };
    }
  }

  return drawingState;
}

export function areRoiEqual(roiA: number[][], roiB: number[][]): boolean {
  if (roiA.length !== roiB.length) {
    return false;
  }

  const sortedArr1 = [...roiA].sort((a, b) => a[0] - b[0]);
  const sortedArr2 = [...roiB].sort((a, b) => a[0] - b[0]);

  for (let i = 0; i < sortedArr1.length; i++) {
    const innerArr1 = sortedArr1[i];
    const innerArr2 = sortedArr2[i];

    if (innerArr1.length !== innerArr2.length) {
      return false;
    }

    for (let j = 0; j < innerArr1.length; j++) {
      if (innerArr1[j] !== innerArr2[j]) {
        return false;
      }
    }
  }
  return true;
}
