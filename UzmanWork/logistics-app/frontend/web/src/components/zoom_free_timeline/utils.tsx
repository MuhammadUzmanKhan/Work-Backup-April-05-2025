import type { PanzoomObject } from "@panzoom/panzoom";
import { DateTime } from "luxon";
import { TimeInterval } from "utils/time";

export const PANZOOM_MIN_ZOOM = 1;
export const PANZOOM_MAX_ZOOM = 100;
export const PANZOOM_MOBILE_ZOOM = 60;

export interface VisiblePortion {
  startRatio: number;
  endRatio: number;
}

export const DEFAULT_VISIBLE_PORTION: VisiblePortion = {
  startRatio: 0,
  endRatio: 1,
};

// Compute the visible portion of the panzoom bbox, knowing the container bbox
export function getVisiblePortionFromPanzoom(
  panzoomElement: HTMLElement,
  containerElement: HTMLElement
): VisiblePortion {
  return {
    startRatio: rectRatio(
      panzoomElement,
      containerElement.getBoundingClientRect().left
    ),
    endRatio: rectRatio(
      panzoomElement,
      containerElement.getBoundingClientRect().right
    ),
  };
}

// Utility function to clamp a value between a min and max
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Get the scale string for the transform property (either style or transform)
export function getScaleString({ sx = 1, sy = 1 }) {
  return `scale(${sx}, ${sy})`;
}

// This is a derivative of the scale which changes less frequently
export enum ScaleDetailLevel {
  OneWeek = "1week",
  OneDay = "1day",
  TwelveHours = "12hours",
  SixHours = "6hours",
  ThreeHours = "3hours",
  OneHour = "1hour",
  ThirtyMinutes = "30minutes",
}

export type MaxScaleForDetailLevel = Map<number, ScaleDetailLevel>;

// NOTE(@lberg): assumption is that this is ordered (see how we use it below)
export const TIMELINE_SCALE_DETAILS: MaxScaleForDetailLevel = new Map([
  [4, ScaleDetailLevel.OneDay],
  [8, ScaleDetailLevel.TwelveHours],
  [16, ScaleDetailLevel.SixHours],
  [32, ScaleDetailLevel.ThreeHours],
  [Infinity, ScaleDetailLevel.OneHour],
]);

// Get the scale detail level from the raw scale
export function scaleDetailFromScale(
  scale: number,
  maxScaleForDetailLevel: MaxScaleForDetailLevel = TIMELINE_SCALE_DETAILS,
  defaultScaleDetailLevel: ScaleDetailLevel = ScaleDetailLevel.OneHour
): ScaleDetailLevel {
  for (const [maxScale, scaleDetail] of maxScaleForDetailLevel) {
    if (scale < maxScale) {
      return scaleDetail;
    }
  }
  console.warn(
    `No scale detail level found for scale ${scale}, using default ${defaultScaleDetailLevel}`
  );
  return defaultScaleDetailLevel;
}

// Short events are shown as thin lines at low zoom levels
// As such, we bump their to make them more visible
export function bumpItemSize(
  offsetStart: number,
  offsetEnd: number,
  scaleDetailLevel: ScaleDetailLevel
): { offsetStart: number; offsetEnd: number } {
  const offsetWidth = offsetEnd - offsetStart;
  // If we are fully zoomed in, we don't need to bump
  let maxWidthForBump = 0;
  if (scaleDetailLevel === "1day") {
    maxWidthForBump = 0.0007;
  } else if (scaleDetailLevel === "12hours") {
    maxWidthForBump = 0.0003;
  } else if (scaleDetailLevel === "6hours") {
    maxWidthForBump = 0.0001;
  }
  const bumpedOffsetStart =
    offsetStart - Math.max(0, (maxWidthForBump - offsetWidth) / 2);
  const bumpedOffsetEnd =
    offsetEnd + Math.max(0, (maxWidthForBump - offsetWidth) / 2);

  return { offsetStart: bumpedOffsetStart, offsetEnd: bumpedOffsetEnd };
}

// Check if a click is a short click based on the start and end time
export function isShortClick(
  start: number,
  end: number,
  threshold = 200
): boolean {
  return end - start < threshold;
}

export function rectRatio(rect: HTMLElement, xOffset: number) {
  const rectWidth = rect.getBoundingClientRect();
  const ratio = (xOffset - rectWidth.left) / rectWidth.width;
  return clamp(ratio, 0, 1);
}

export function computeRatio(
  value: number,
  visiblePortion: VisiblePortion,
  shouldClamp = false
) {
  const { startRatio: min, endRatio: max } = visiblePortion;
  if (shouldClamp) {
    return clamp((value - min) / (max - min), 0, 1);
  }
  return (value - min) / (max - min);
}

// TODO(@lberg): these functions lack checks
export function timeFromRatio(ratio: number, range: TimeInterval) {
  const seconds =
    clamp(ratio, 0, 1) * range.timeEnd.diff(range.timeStart).as("seconds");
  return range.timeStart.plus({ seconds });
}

export function dayRatioFromTime(time: DateTime, startDay: DateTime) {
  const seconds = time.diff(startDay).as("seconds");
  const secondsInDay = startDay.endOf("day").diff(startDay).as("seconds");
  return clamp(seconds / secondsInDay, 0, 1);
}

export function centerPanzoomOnTime(
  time: DateTime,
  timeInterval: TimeInterval,
  panzoomElementWidth: number,
  panzoomInstance: PanzoomObject,
  zoom?: number,
  onCentered?: (panzoomInstance: PanzoomObject) => void
) {
  // The chart by default centered on midday.
  // Negative offsets move to the right, positive to the left
  const centerTime = timeFromRatio(0.5, {
    timeStart: timeInterval.timeStart,
    timeEnd: timeInterval.timeEnd,
  });
  const rangeSeconds = timeInterval.timeEnd
    .diff(timeInterval.timeStart)
    .as("seconds");
  const offsetX =
    (centerTime.diff(time).as("seconds") / rangeSeconds) * panzoomElementWidth;
  // NOTE(@lberg): I was never able to get
  // https://github.com/timmywil/panzoom#zoomtopoint to work
  panzoomInstance.zoom(zoom || panzoomInstance.getScale());
  // Need to wait a bit due to async nature of panzoom
  // https://github.com/timmywil/panzoom#a-note-on-the-async-nature-of-panzoom
  setTimeout(() => {
    panzoomInstance.pan(offsetX, 0);
    onCentered?.(panzoomInstance);
  }, 100);
}
