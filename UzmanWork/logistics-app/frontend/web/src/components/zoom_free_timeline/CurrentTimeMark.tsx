import { VisiblePortion, computeRatio, dayRatioFromTime } from "./utils";
import { useEffect, useState } from "react";
import { TimeMark } from "./TimeMark";
import { DateTime } from "luxon";

interface CurrentTimeMarkProps {
  visiblePortion: VisiblePortion;
  height: number;
  containerWidth: number;
  timezone: string;
}

export function CurrentTimeMark({
  visiblePortion,
  height,
  containerWidth,
  timezone,
}: CurrentTimeMarkProps) {
  const [currentTime, setCurrentTime] = useState<DateTime>(
    DateTime.now().setZone(timezone)
  );
  // Update the current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(DateTime.now().setZone(timezone));
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [setCurrentTime, timezone]);

  const markPosition = computeRatio(
    dayRatioFromTime(currentTime, currentTime.startOf("day")),
    visiblePortion
  );
  return (
    <TimeMark
      y={0}
      height={height}
      containerWidth={containerWidth}
      pointerOffset={markPosition}
      strokeWidth={2}
    />
  );
}
