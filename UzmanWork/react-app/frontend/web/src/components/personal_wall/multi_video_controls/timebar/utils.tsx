import {
  MaxScaleForDetailLevel,
  ScaleDetailLevel,
} from "components/zoom_free_timeline/utils";

export const MULTI_VIDEO_TIMEBAR_SCALE_DETAILS: MaxScaleForDetailLevel =
  new Map([
    [4, ScaleDetailLevel.OneWeek],
    [8, ScaleDetailLevel.OneDay],
    [16, ScaleDetailLevel.TwelveHours],
    [32, ScaleDetailLevel.SixHours],
    [86, ScaleDetailLevel.ThreeHours],
    [250, ScaleDetailLevel.OneHour],
    [Infinity, ScaleDetailLevel.ThirtyMinutes],
  ]);
