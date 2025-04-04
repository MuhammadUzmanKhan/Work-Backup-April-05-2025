import { CLIP_DURATION_MINUTES } from "./player_options";
import { DateTime } from "luxon";
import { TimeInterval } from "./time";

interface OutClipResult {
  command: "out_clip";
  timeInterval: TimeInterval;
}

interface InFutureResult {
  command: "in_future";
}

interface InClipResult {
  command: "in_clip";
  time: DateTime;
}

type OnNewTimeResult = OutClipResult | InFutureResult | InClipResult;

export function onNewTime(
  timeNew: DateTime,
  currentTimeInterval: TimeInterval
): OnNewTimeResult {
  if (timeNew >= DateTime.now()) {
    return { command: "in_future" };
  }
  if (
    timeNew < currentTimeInterval.timeStart ||
    timeNew > currentTimeInterval.timeEnd
  ) {
    return {
      command: "out_clip",
      timeInterval: {
        timeStart: timeNew,
        timeEnd: timeNew.plus({ minutes: CLIP_DURATION_MINUTES }),
      },
    };
  }
  return { command: "in_clip", time: timeNew };
}

export function getTimeBarTimeControls(pivotTime: DateTime, numDays = 7) {
  const today = DateTime.now().endOf("day");
  const totalMinutes = today.diff(today.minus({ days: numDays })).as("minutes");
  // Show up to 1/2 of the days in the future limited by today
  const futureMinutes = Math.min(
    totalMinutes / 2,
    today.diff(pivotTime, "minutes").as("minutes")
  );
  const pastMinutes = totalMinutes - futureMinutes;
  return {
    timeStart: pivotTime.minus({ minutes: pastMinutes }),
    timeEnd: pivotTime.plus({ minutes: futureMinutes }),
  };
}
