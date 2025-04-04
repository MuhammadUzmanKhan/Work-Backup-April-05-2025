import { vectorToArray } from "components/timeline/utils";
import { DrawingMode, DrawingState, FULL_IMAGE_RECTANGLE } from "./drawing";
import {
  DetectionObjectType,
  DetectionObjectTypeCategory,
} from "coram-common-utils";
import { toDetectionType } from "./detection_aggregation";

export function roiFromDrawingState(drawingState: DrawingState) {
  let roi: number[][] = [];
  switch (drawingState.drawingMode) {
    case DrawingMode.FullImage:
      roi = FULL_IMAGE_RECTANGLE.map((vector) => vectorToArray(vector));
      break;
    case DrawingMode.Rectangle:
      if (drawingState.rects.length === 1) {
        roi = [
          vectorToArray(drawingState.rects[0].coord_min),
          vectorToArray(drawingState.rects[0].coord_max),
        ];
      }
      break;
    case DrawingMode.Polygon:
      if (drawingState.polygons.length === 1) {
        roi = drawingState.polygons[0].map((vector) => vectorToArray(vector));
      }
      break;
    default: {
      const _exhaustiveCheck: never = drawingState.drawingMode;
      throw new Error(`Unhandled drawing mode: ${_exhaustiveCheck}`);
    }
  }
  return roi;
}

const ALL_AGGREGATED_TYPES: DetectionObjectTypeCategory[] = (
  Object.values(DetectionObjectTypeCategory) as DetectionObjectTypeCategory[]
).filter((type) => type !== DetectionObjectTypeCategory.UNKNOWN);

// Return an aggregated type if all of the given types are included in it.
// Repeat for all aggregated types.
export function aggregatedTypesFromDetectionTypes(
  detectionObjectTypes: DetectionObjectType[]
): Set<DetectionObjectTypeCategory> {
  return new Set(
    ALL_AGGREGATED_TYPES.filter((type) =>
      toDetectionType(type).every((t) => detectionObjectTypes.includes(t))
    )
  );
}
