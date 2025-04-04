import React, { useContext, useEffect, useMemo, useRef, useState } from "react";

import Two from "two.js";
import { Vector } from "two.js/src/vector";

import { FlattenPoint, FlattenSegment, FlattenVector } from "flatten";
import {
  addLineToTwo,
  COLOR,
  DrawerRect,
  DrawingMode,
  DrawingStateContext,
  drawPolygonLines,
  isDrawingStateContext,
  pointsAreClose,
  SimplePolygon,
} from "utils/drawing";
import { PolyDrawerRectCoordinates } from "utils/globals";
import { ElementSize } from "hooks/element_size";

const LINE_WIDTH = 4;
const SNAPPING_THRESHOLD_RECTANGLE = 30;
const SNAPPING_THRESHOLD_POLYGON = 10;
const ANGLE_EPSILON = 0.03;

interface PolyDrawerProps {
  style?: React.CSSProperties;
  videoSize: ElementSize;
  moveToForeground?: () => void;
  moveToBackground?: () => void;
}

// TODO(@lberg): move to konva as the current implementation is a mess.
export function PolyDrawer({
  style = undefined,
  videoSize,
  moveToForeground = () => null,
  moveToBackground = () => null,
}: PolyDrawerProps) {
  const { drawingState, setDrawingState } = isDrawingStateContext(
    useContext(DrawingStateContext)
  );
  const twoRef = useRef<Two>();
  const [mousePos, setMousePos] = useState<Vector>(new Vector(0, 0));
  // The points for the current rectangle or polygon we are drawing.
  const [points, setPoints] = useState<SimplePolygon>([]);
  // Whether we are currently between a mouse down and mouse up event.
  const [isDragging, setIsDragging] = useState(false);
  const [disallowedNewPoint, setDisallowedNewPoint] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  // Vector with the size of the canvas
  const divSize = useMemo(
    () => new Vector(videoSize.width, videoSize.height),
    [videoSize.width, videoSize.height]
  );

  // Whether to enable drawing interactions with the canvas
  const enableInteractions = useMemo(() => {
    if (
      drawingState.drawingMode === DrawingMode.Rectangle &&
      drawingState.rects.length === 0
    )
      return true;
    if (
      drawingState.drawingMode === DrawingMode.Polygon &&
      drawingState.polygons.length === 0
    )
      return true;
    return false;
  }, [
    drawingState.drawingMode,
    drawingState.rects.length,
    drawingState.polygons.length,
  ]);
  useEffect(() => {
    if (points.length < 2) {
      setDisallowedNewPoint(false);
      return;
    }
    // Get flatten segments for all polygon lines except the last one. The last
    // one always has intersection with the next one.
    const segments = points.slice(0, points.length - 2).map((p, i) => {
      return FlattenSegment(
        FlattenPoint(p.x, p.y),
        FlattenPoint(points[i + 1].x, points[i + 1].y)
      );
    });

    // The new segment we are about to add based on mouse position.
    const tentativeNewSegment = FlattenSegment(
      FlattenPoint(points[points.length - 1].x, points[points.length - 1].y),
      FlattenPoint(mousePos.x, mousePos.y)
    );

    const intersected = segments.some(
      (segment) => segment.intersect(tentativeNewSegment).length > 0
    );
    // Disallow the tentative new point as it will cause self-intersection.
    if (intersected) {
      setDisallowedNewPoint(true);
      return;
    }

    // If there is no intersection check that the angle between the last
    // segment and the new segments is non-zero. Otherwise, we risk creating
    // zero-area polygons.
    const tentativeNewDirection = FlattenVector(
      tentativeNewSegment.ps,
      tentativeNewSegment.pe
    );

    // If the new direction is too small, do not check angles.
    if (tentativeNewDirection.length < 0.0001) {
      setDisallowedNewPoint(false);
      return;
    }

    const lastDirection = FlattenVector(
      FlattenPoint(points[points.length - 1].x, points[points.length - 1].y),
      FlattenPoint(points[points.length - 2].x, points[points.length - 2].y)
    );
    const angle = tentativeNewDirection.angleTo(lastDirection);

    if (angle < ANGLE_EPSILON || angle > 2 * Math.PI - ANGLE_EPSILON) {
      setDisallowedNewPoint(true);
      return;
    }
    setDisallowedNewPoint(false);
  }, [points, mousePos]);

  // If drawing mode changes, reset the points.
  useEffect(() => {
    setPoints([]);
  }, [drawingState.drawingMode]);

  // Setup two.js and interaction events
  useEffect(() => {
    if (!elementRef.current) return;
    const div = elementRef.current;

    function updateMousePos(ev: MouseEvent) {
      if (!div) {
        return mousePos;
      }
      const newMousePos = new Vector(
        ev.clientX - div.getBoundingClientRect().left,
        ev.clientY - div.getBoundingClientRect().top
      ).divide(divSize.x, divSize.y);
      setMousePos(newMousePos);
      return newMousePos;
    }

    // Define events callbacks
    const handleMouseDown = (ev: MouseEvent) => {
      const mousePos = updateMousePos(ev);
      setIsDragging(true);
      moveToForeground();
      if (
        drawingState.drawingMode === DrawingMode.Rectangle &&
        points.length == 0
      ) {
        // If in Rectangle mode, we set the first point.
        setPoints([mousePos.clone()]);
        return;
      }
      // Nothing to do for polygons, we add points on mouse up events.
    };
    const handleMouseUp = (ev: MouseEvent) => {
      const mousePos = updateMousePos(ev);
      setIsDragging(false);
      moveToBackground();
      if (drawingState.drawingMode === DrawingMode.Rectangle) {
        if (points.length !== 1) return; // Ignore. Not possible.
        if (
          pointsAreClose(
            points[0],
            mousePos,
            divSize,
            SNAPPING_THRESHOLD_RECTANGLE
          )
        ) {
          setDrawingState((state) => ({
            ...state,
            closeIconPosition: undefined,
          }));
        } else {
          setDrawingState((state) => ({
            ...state,
            rects: [new DrawerRect(points[0], mousePos, COLOR)],
          }));
        }
        setPoints([]);
      }
      if (drawingState.drawingMode === DrawingMode.Polygon) {
        if (points.length === 0) {
          setPoints([mousePos.clone()]);
          return;
        } else if (points.length === 1) {
          if (
            !pointsAreClose(
              points[0],
              mousePos,
              divSize,
              SNAPPING_THRESHOLD_POLYGON
            )
          ) {
            setPoints([...points, mousePos.clone()]);
          }
          return;
        } else {
          if (
            pointsAreClose(
              points[0],
              mousePos,
              divSize,
              SNAPPING_THRESHOLD_POLYGON
            )
          ) {
            // If we click close to the start finalize the polygon.
            if (points.length > 2) {
              setDrawingState((state) => ({
                ...state,
                polygons: [[...points] as SimplePolygon],
              }));
            } else {
              // If we only have 2 points, cancel the drawing as it is a line
              // with 0 area.
              setDrawingState((state) => ({
                ...state,
                closeIconPosition: undefined,
              }));
            }
            setPoints([]);
          } else {
            // Add a new point to the polygon if not disallowed.
            if (
              !disallowedNewPoint &&
              !pointsAreClose(
                points[points.length - 1],
                mousePos,
                divSize,
                SNAPPING_THRESHOLD_POLYGON
              )
            ) {
              setPoints([...points, mousePos.clone()]);
            }
          }
        }
      }
    };
    const handleMouseMove = (ev: MouseEvent) => {
      updateMousePos(ev);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Escape") {
        if (drawingState.drawingMode === DrawingMode.Polygon) {
          setPoints([]);
        }
      }
    };

    if (enableInteractions) {
      div.addEventListener("pointermove", handleMouseMove);
      div.addEventListener("pointerdown", handleMouseDown);
      div.addEventListener("pointerup", handleMouseUp);
      window.addEventListener("keydown", handleKeyDown);
    }

    // TODO(@lberg): find a way to remove two in return
    if (!twoRef.current) {
      twoRef.current = new Two({
        fitted: true,
      }).appendTo(div);
    }

    return () => {
      // TODO(@lberg): these are remove and re-added continuously!
      if (enableInteractions) {
        div.removeEventListener("pointermove", handleMouseMove);
        div.removeEventListener("pointerdown", handleMouseDown);
        div.removeEventListener("pointerup", handleMouseUp);
        window.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, [
    setMousePos,
    elementRef,
    divSize,
    points,
    setPoints,
    isDragging,
    setIsDragging,
    // TODO(@lberg): this should NOT be a dependency!
    mousePos,
    enableInteractions,
    drawingState.drawingMode,
    setDrawingState,
    disallowedNewPoint,
    moveToForeground,
    moveToBackground,
  ]);

  // Draw function
  useEffect(() => {
    const two = twoRef.current;
    if (!two) {
      return;
    }
    // Set the canvas size based on the current estimate
    two.fit();
    // Remove everything already painted
    two.clear();

    // Add all the rects we already have first
    drawingState.rects
      .filter((rect) => rect.visible)
      .forEach((rect) => {
        const rectDraw = DrawerRect.scale(rect, divSize).addRectToTwo(
          two,
          LINE_WIDTH,
          null,
          "55" // semi-transparent
        );
        setDrawingState((state) => ({
          ...state,
          closeIconPosition:
            rectDraw.getBoundingClientRect() as PolyDrawerRectCoordinates,
        }));
      });

    // Add the polygons we already have
    drawingState.polygons.forEach((polygon) => {
      const path = two.makePath(
        ...polygon.map((p) => [p.x * divSize.x, p.y * divSize.y]).flat()
      );
      path.stroke = COLOR;
      path.linewidth = LINE_WIDTH;
      path.fill = `${COLOR}55`;
      setDrawingState((state) => ({
        ...state,
        closeIconPosition:
          path.getBoundingClientRect() as PolyDrawerRectCoordinates,
      }));
    });

    // Draw the rectangle or polygon we are currently drawing.
    if (points.length === 0) {
      // Nothing to draw.
      two.update();
      return;
    }
    if (drawingState.drawingMode === DrawingMode.Rectangle && isDragging) {
      const scaledRect = DrawerRect.scale(
        new DrawerRect(points[0], mousePos, COLOR),
        divSize
      );
      scaledRect.addRectToTwo(two, LINE_WIDTH, [3, 2]);
    } else if (drawingState.drawingMode === DrawingMode.Polygon) {
      drawPolygonLines(two, points, divSize, points.length - 1, LINE_WIDTH);
      addLineToTwo(
        two,
        points[points.length - 1],
        mousePos,
        divSize,
        LINE_WIDTH,
        disallowedNewPoint ? "red" : COLOR,
        [3, 2]
      );
    }

    // Draw everything
    two.update();
  }, [
    mousePos,
    divSize,
    points,
    isDragging,
    drawingState.rects,
    drawingState.polygons,
    drawingState.drawingMode,
    setDrawingState,
    disallowedNewPoint,
  ]);

  return (
    <div
      data-testid="poly-drawer"
      // Allow to capture key events
      tabIndex={-1}
      ref={elementRef}
      style={{
        ...style,
        pointerEvents: enableInteractions ? "auto" : "none",
        cursor: enableInteractions ? "crosshair" : "default",
        width: videoSize.width,
        height: videoSize.height,
      }}
    ></div>
  );
}
