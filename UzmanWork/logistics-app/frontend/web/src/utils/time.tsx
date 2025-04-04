import { DateTime } from "luxon";

export interface TimeInterval {
  timeStart: DateTime;
  timeEnd: DateTime;
}

export interface ClipTimeSyncData {
  timeInterval: TimeInterval;
  syncTime: DateTime;
}

export function clipSyncDataFromSearchParams(
  searchParams: URLSearchParams
): ClipTimeSyncData | null {
  const timeStartStr = searchParams.get("ts");
  if (!timeStartStr) {
    return null;
  }

  const timeStart = DateTime.fromMillis(Number(timeStartStr));
  if (!timeStart.isValid) {
    return null;
  }
  const timeEndStr = searchParams.get("te");
  if (!timeEndStr) {
    return null;
  }
  const timeEnd = DateTime.fromMillis(Number(timeEndStr));
  if (!timeEnd.isValid) {
    return null;
  }

  return {
    timeInterval: {
      timeStart: timeStart,
      timeEnd: timeEnd,
    },
    syncTime: timeStart,
  };
}

export function timeZoneStrToHumanReadableTimezone(
  timeZoneStr: string
): string {
  return timeZoneStr.replaceAll("_", " ");
}
