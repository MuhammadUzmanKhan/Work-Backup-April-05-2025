import Konva from "konva";
import {
  ARROW_LENGTH,
  ARROW_OFFSET,
  CLOSE_ICON_OFFSET,
  CLOSE_ICON_RADIUS,
} from "./consts";
import { Line } from "./types";

export function scaleVector(
  vector: Konva.Vector2d,
  width: number,
  height: number
) {
  return {
    x: vector.x * width,
    y: vector.y * height,
  };
}

export function scaleLine(line: Line, width: number, height: number) {
  return {
    start: scaleVector(line.start, width, height),
    end: scaleVector(line.end, width, height),
  };
}

export function normaliseVector(
  vector: Konva.Vector2d,
  width: number,
  height: number
) {
  return {
    x: vector.x / width,
    y: vector.y / height,
  };
}

export function vectorToArray(vector: Konva.Vector2d) {
  return [vector.x, vector.y];
}

export enum ArrowDirection {
  Left = -1,
  Right = 1,
}

export function getArrowPoints({
  line,
  direction,
  width,
  height,
}: {
  line: Line;
  direction: ArrowDirection;
  width: number;
  height: number;
}) {
  const { x: startX, y: startY } = line.start;
  const { x: endX, y: endY } = line.end;

  const dx = endX - startX;
  const dy = endY - startY;
  const midX = startX + dx / 2;
  const midY = startY + dy / 2;

  const angle = Math.atan2(dy, dx) + Math.PI / 2;

  let arrowTipX = midX + direction * ARROW_LENGTH * Math.cos(angle);
  let arrowTipY = midY + direction * ARROW_LENGTH * Math.sin(angle);

  let scaleX = 1;
  let scaleY = 1;

  if (arrowTipX < 0) scaleX = midX / (midX - arrowTipX);
  if (arrowTipX > width) scaleX = (width - midX) / (arrowTipX - midX);
  if (arrowTipY < 0) scaleY = midY / (midY - arrowTipY);
  if (arrowTipY > height) scaleY = (height - midY) / (arrowTipY - midY);

  const scale = Math.min(scaleX, scaleY);

  arrowTipX = midX + scale * direction * ARROW_LENGTH * Math.cos(angle);
  arrowTipY = midY + scale * direction * ARROW_LENGTH * Math.sin(angle);

  return [
    midX + scale * direction * ARROW_OFFSET * Math.cos(angle),
    midY + scale * direction * ARROW_OFFSET * Math.sin(angle),
    arrowTipX,
    arrowTipY,
  ];
}

export function getClearButtonPosition(line: Line) {
  const dx = line.end.x - line.start.x;
  const dy = line.end.y - line.start.y;
  const angle = Math.atan2(dy, dx);

  const closeIconX = line.end.x + Math.cos(angle) * CLOSE_ICON_OFFSET;
  const closeIconY = line.end.y + Math.sin(angle) * CLOSE_ICON_OFFSET;

  // ensure that we don't get out of the Stage bounds
  return {
    x: Math.max(CLOSE_ICON_RADIUS, Math.min(closeIconX, 1 - CLOSE_ICON_RADIUS)),
    y: Math.max(CLOSE_ICON_RADIUS, Math.min(closeIconY, 1 - CLOSE_ICON_RADIUS)),
  };
}
