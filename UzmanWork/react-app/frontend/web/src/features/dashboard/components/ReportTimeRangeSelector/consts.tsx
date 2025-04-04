import { RelativeTimeRangeOption } from "components/common";
import { Duration } from "luxon";

export const RELATIVE_TIME_RANGE_OPTIONS: RelativeTimeRangeOption[] = [
  {
    label: "Last 24 Hours",
    duration: Duration.fromObject({ hour: 24 }),
  },
  {
    label: "Last Two Days",
    duration: Duration.fromObject({ day: 2 }),
  },
  {
    label: "Last 1 Week",
    duration: Duration.fromObject({ week: 1 }),
  },
  {
    label: "Last 2 Weeks",
    duration: Duration.fromObject({ week: 2 }),
  },
  {
    label: "Last 1 Month",
    duration: Duration.fromObject({ month: 1 }),
  },
];
