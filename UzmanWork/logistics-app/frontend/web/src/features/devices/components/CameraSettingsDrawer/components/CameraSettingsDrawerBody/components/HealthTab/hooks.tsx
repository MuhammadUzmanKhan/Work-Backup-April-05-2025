import { DateTime, Duration } from "luxon";
import { DateRange } from "components/common";
import { useEffect, useRef, useState } from "react";
import { TimeInterval } from "utils/time";

export function useUpdatedTimeInterval() {
  const [timeInterval, setTimeInterval] = useState<TimeInterval>({
    timeStart: DateTime.now().minus({ hour: 24 }),
    timeEnd: DateTime.now(),
  });
  const [dateRange, setDateRange] = useState<DateRange>({
    type: "relative",
    duration: Duration.fromObject({ hour: 24 }),
  });

  const updateTimeInterval = (dateRange: DateRange) => {
    if (dateRange.type === "relative") {
      setTimeInterval({
        timeStart: DateTime.now().minus(dateRange.duration),
        timeEnd: DateTime.now(),
      });
      setDateRange(dateRange);
    } else {
      setTimeInterval({
        timeStart: dateRange.timeInterval.timeStart,
        timeEnd: dateRange.timeInterval.timeEnd,
      });
    }
  };

  // the main goal of this hook is to update timeInterval every 10 seconds
  // if the date range is relative. This is required to refetch the data
  // based on updated time interval and redraw the chart as chart max and min
  // values are based on timeInterval.
  const timeIntervalUpdaterRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeIntervalUpdaterRef.current) {
      clearInterval(timeIntervalUpdaterRef.current);
    }

    if (dateRange.type === "relative") {
      timeIntervalUpdaterRef.current = setInterval(() => {
        setTimeInterval({
          timeStart: DateTime.now().minus(dateRange.duration),
          timeEnd: DateTime.now(),
        });
      }, 20000);
    }
  }, [dateRange]);

  return { timeInterval, updateTimeInterval };
}
