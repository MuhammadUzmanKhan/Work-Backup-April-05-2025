import {
  AbsoluteTimeRange as AbsoluteTimeRangeOrig,
  RelativeTimeRange,
  isDefined,
} from "coram-common-utils";
import { DateRange, DateRangeSelector } from "components/common";
import { Duration } from "luxon";
import { AbsoluteTimeRange } from "features/dashboard/types";
import { type SvgIconComponent } from "@mui/icons-material";
import { RELATIVE_TIME_RANGE_OPTIONS } from "./consts";
import type { SelectProps } from "@mui/material";

interface SelectTimeRangeProps {
  initialTimeRange: AbsoluteTimeRange | RelativeTimeRange;
  onTimeRangeChange?: (
    timeRange: AbsoluteTimeRange | RelativeTimeRange
  ) => void;
  variant?: SelectProps["variant"];
  Icon?: SvgIconComponent;
}

export function ReportTimeRangeSelector({
  initialTimeRange,
  onTimeRangeChange,
  variant = "outlined",
  Icon,
}: SelectTimeRangeProps) {
  return (
    <DateRangeSelector
      initialDateRange={
        initialTimeRange.time_range_type ===
        AbsoluteTimeRangeOrig.time_range_type.ABSOLUTE
          ? {
              type: "absolute",
              timeInterval: {
                timeStart: initialTimeRange.start_time,
                timeEnd: initialTimeRange.end_time,
              },
            }
          : {
              type: "relative",
              duration: Duration.fromObject({
                seconds: (initialTimeRange as RelativeTimeRange).time_interval,
              }),
            }
      }
      variant={variant}
      onDateRangeChange={
        isDefined(onTimeRangeChange)
          ? (dateRange: DateRange) => {
              if (dateRange.type === "absolute") {
                onTimeRangeChange({
                  time_range_type:
                    AbsoluteTimeRangeOrig.time_range_type.ABSOLUTE,
                  start_time: dateRange.timeInterval.timeStart,
                  end_time: dateRange.timeInterval.timeEnd,
                });
              } else {
                onTimeRangeChange({
                  time_range_type: RelativeTimeRange.time_range_type.RELATIVE,
                  time_interval: dateRange.duration.as("seconds"),
                });
              }
            }
          : undefined
      }
      Icon={Icon}
      relativeTimeRangeOptions={RELATIVE_TIME_RANGE_OPTIONS}
    />
  );
}
