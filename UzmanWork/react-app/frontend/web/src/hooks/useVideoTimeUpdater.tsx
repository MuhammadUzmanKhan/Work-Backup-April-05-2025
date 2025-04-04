import { useCallback, useEffect, useState } from "react";
import { DateTime, Duration } from "luxon";
import { CLIP_DURATION_MINUTES } from "utils/player_options";
import { TimeInterval } from "utils/time";
import { isDefined } from "coram-common-utils";

// How far ahead of the start time the end time should be.
const END_TIME_OFFSET = Duration.fromDurationLike({
  minutes: CLIP_DURATION_MINUTES,
});

function getTimeInterval(
  timeInterval: TimeInterval | null,
  timezone: string
): TimeInterval {
  if (!isDefined(timeInterval)) {
    return {
      timeStart: DateTime.now().setZone(timezone).minus(END_TIME_OFFSET),
      timeEnd: DateTime.now().setZone(timezone),
    };
  }
  const timeNow = DateTime.now().setZone(timezone);
  const timeEnd = timeInterval.timeEnd;
  return {
    timeStart: timeInterval.timeStart,
    timeEnd: timeEnd > timeNow ? timeNow : timeEnd,
  };
}

export function useTimeIntervalUpdater(
  initialTimeInterval: TimeInterval | null,
  timezone: string
) {
  const [timeInterval, setTimeInterval] = useState<TimeInterval>(() =>
    getTimeInterval(initialTimeInterval, timezone)
  );

  useEffect(() => {
    setTimeInterval(getTimeInterval(initialTimeInterval, timezone));
  }, [initialTimeInterval, timezone]);

  const setStartTime = useCallback(
    (time: DateTime) => {
      setTimeInterval((prev) => ({
        timeStart: time.setZone(timezone),
        timeEnd: prev.timeEnd,
      }));
    },
    [timezone]
  );

  const setEndTime = useCallback(
    (time: DateTime) => {
      setTimeInterval((prev) => ({
        timeStart: prev.timeStart,
        timeEnd: time.setZone(timezone),
      }));
    },
    [timezone]
  );

  return { timeInterval, setTimeInterval, setStartTime, setEndTime };
}
