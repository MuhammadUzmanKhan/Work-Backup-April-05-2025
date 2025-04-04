import { createContext, Dispatch, SetStateAction } from "react";
import Two from "two.js";
import { Line } from "two.js/src/shapes/line";
import { Rectangle } from "two.js/src/shapes/rectangle";
import { Vector } from "two.js/src/vector";
import { PolyDrawerRectCoordinates } from "../utils/globals";

export const COLOR = "#45B39D";

// If number of element is 2, it is a rectangle represented by bottom left and top right points.
// If number of element is more than 2, it is a polygon represented by a list of points.
export type SimplePolygon = Vector[];

export enum DrawingMode {
  FullImage = 0,
  Rectangle = 1,
  Polygon = 2,
}

export const FULL_IMAGE_RECTANGLE: SimplePolygon = [
  Vector.zero,
  new Vector(1, 1),
];

export function arrayToVector(point: number[]) {
  if (point.length !== 2) throw new Error("Point must have 2 elements");
  return new Vector(point[0], point[1]);
}

export function isRectangle(polygon: SimplePolygon) {
  return polygon.length === 2;
}

export function isFullImageRectangle(polygon: SimplePolygon) {
  return (
    polygon.length === 2 &&
    polygon[0].equals(Vector.zero) &&
    polygon[1].equals(new Vector(1, 1))
  );
}

export function polygonToDrawRect(polygon: SimplePolygon): DrawerRect {
  if (!isRectangle(polygon)) {
    throw new Error("ROI rectangle must have 2 points");
  }
  // TODO(nedyalko): Remove hard-coded color, when we allow multiple regions.
  const rectDraw = new DrawerRect(polygon[0], polygon[1], "#45B39D");
  return rectDraw;
}

// TODO(@lberg): explain what this is for
export class DrawerRect {
  coord_min: Vector;
  coord_max: Vector;
  color: string;
  visible: boolean;

  constructor(point1: Vector, point2: Vector, color: string, visible = true) {
    this.coord_min = new Vector(
      Math.min(point1.x, point2.x),
      Math.min(point1.y, point2.y)
    );
    this.coord_max = new Vector(
      Math.max(point1.x, point2.x),
      Math.max(point1.y, point2.y)
    );

    this.color = color;
    this.visible = visible;
  }

  center(): Vector {
    return Vector.add(this.coord_min, this.coord_max).divide(2);
  }

  extent(): { width: number; height: number } {
    const width = this.coord_max.x - this.coord_min.x;
    const height = this.coord_max.y - this.coord_min.y;
    return { width, height };
  }

  static scale(rect: DrawerRect, value: Vector): DrawerRect {
    return new DrawerRect(
      rect.coord_min.clone().multiply(value),
      rect.coord_max.clone().multiply(value),
      rect.color,
      rect.visible
    );
  }

  scale(value: Vector): DrawerRect {
    this.coord_min.multiply(value);
    this.coord_max.multiply(value);
    return this;
  }

  // Adds the rectangle to the two.js scene
  addRectToTwo(
    two: Two,
    linewidth: number,
    dashes: number[] | null,
    fillAlpha = "00"
  ): Rectangle {
    const center = this.center();
    const { width, height } = this.extent();
    const two_rectangle = two.makeRectangle(center.x, center.y, width, height);

    // Add style
    two_rectangle.stroke = this.color;
    two_rectangle.linewidth = linewidth;
    if (dashes) {
      two_rectangle.dashes = dashes;
    }
    two_rectangle.fill = `${COLOR}${fillAlpha}`;

    return two_rectangle;
  }
}

export function addLineToTwo(
  two: Two,
  point1: Vector,
  point2: Vector,
  scale: Vector,
  lineWidth: number,
  color: string,
  dashes: number[] | null
): Line {
  const p1 = point1.clone().multiply(scale);
  const p2 = point2.clone().multiply(scale);
  const two_line = two.makeLine(p1.x, p1.y, p2.x, p2.y);
  // TODO(Nedyalko): Fix this hardcoded value when we have more than one
  // polygons/rectangles.
  two_line.stroke = color;
  two_line.linewidth = lineWidth;
  if (dashes) {
    two_line.dashes = dashes;
  }
  return two_line;
}

export function drawPolygonLines(
  two: Two,
  points: Vector[],
  scale: Vector,
  numLines: number,
  lineWidth: number
) {
  if (numLines > points.length - 1) {
    throw new Error("Trying to draw more lines than the polygons has.");
  }
  for (let i = 0; i < numLines; i++) {
    addLineToTwo(two, points[i], points[i + 1], scale, lineWidth, COLOR, null);
  }
}

export function pointsAreClose(
  point1: Vector,
  point2: Vector,
  scale: Vector,
  threshold: number
): boolean {
  const p1 = point1.clone().multiply(scale);
  const p2 = point2.clone().multiply(scale);
  return p1.distanceTo(p2) < threshold;
}

export interface DrawingState {
  rects: DrawerRect[];
  polygons: SimplePolygon[];
  drawingMode: DrawingMode;
  closeIconPosition?: PolyDrawerRectCoordinates;
}

export interface DrawingStateContextType {
  drawingState: DrawingState;
  setDrawingState: Dispatch<SetStateAction<DrawingState>>;
}

export const INITIAL_DRAWING_STATE: DrawingState = {
  rects: [],
  polygons: [],
  drawingMode: DrawingMode.FullImage,
  closeIconPosition: undefined,
};

export const DrawingStateContext =
  createContext<DrawingStateContextType | null>(null);

export function isDrawingStateContext(
  source: DrawingStateContextType | null
): DrawingStateContextType {
  if (source === null) {
    throw new Error("source is null");
  }
  return source;
}

// TODO(@lberg): this check is not sufficient as it will return True
// even before we start drawing, but for now it's the best we can have
// without refactoring the drawing logic
export function isActivelyDrawing(drawingState: DrawingState): boolean {
  if (drawingState.drawingMode === DrawingMode.FullImage) {
    return false;
  }
  // If we have already drawn something, we are not actively drawing.
  if (drawingState.polygons.length != 0 || drawingState.rects.length !== 0) {
    return false;
  }
  return true;
}
