import { Duration } from "luxon";

export const MIN_EVENT_DURATION_OPTIONS = [
  {
    label: "5 Seconds",
    duration: Duration.fromObject({ second: 5 }),
  },
  {
    label: "10 Seconds",
    duration: Duration.fromObject({ second: 10 }),
  },
  {
    label: "30 Seconds",
    duration: Duration.fromObject({ second: 30 }),
  },
  {
    label: "1 Minute",
    duration: Duration.fromObject({ minute: 1 }),
  },
  {
    label: "3 Minute",
    duration: Duration.fromObject({ minute: 3 }),
  },
];

export const INTERVAL_DURATION_OPTIONS = [
  {
    label: "5 Seconds",
    duration: Duration.fromObject({ second: 5 }),
  },
  {
    label: "10 Seconds",
    duration: Duration.fromObject({ second: 10 }),
  },
  {
    label: "30 Seconds",
    duration: Duration.fromObject({ second: 30 }),
  },
  {
    label: "1 Minute",
    duration: Duration.fromObject({ minute: 1 }),
  },
  {
    label: "3 Minute",
    duration: Duration.fromObject({ minute: 3 }),
  },
];
