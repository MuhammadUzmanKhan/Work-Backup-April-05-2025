import { DateTime } from "luxon";

export function networkTimeToDateTime(time: string) {
  // time here must be in 24 format which is ISO-compatible
  return DateTime.fromISO(time, { zone: "UTC" });
}

export function dateTimeToNetworkTime(time: DateTime) {
  // This is 24 format which is ISO-compatible
  // so it's compatible with the backend
  return time.toFormat("HH:mm");
}
