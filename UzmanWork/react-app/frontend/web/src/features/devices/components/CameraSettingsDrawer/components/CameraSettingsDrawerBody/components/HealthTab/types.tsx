import { TimeInterval } from "utils/time";

export type UptimeRecord = {
  type: "Online" | "Offline";
  interval: TimeInterval;
};
