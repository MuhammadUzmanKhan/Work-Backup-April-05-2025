import type {
  CameraDowntime as CameraDowntimeOrig,
  CameraPipelineAlertCreate as CameraPipelineAlertCreateOrig,
} from "coram-common-utils";
import { DateTime } from "luxon";

export interface CameraPipelineAlertCreate
  extends Omit<CameraPipelineAlertCreateOrig, "time_generated"> {
  time_generated: DateTime;
}

export function parseRecentCameraPipelineAlerts(
  alerts: CameraPipelineAlertCreateOrig[]
) {
  return alerts.map((alert) => ({
    ...alert,
    time_generated: DateTime.fromISO(alert.time_generated),
  }));
}

export interface CameraDowntime
  extends Omit<CameraDowntimeOrig, "downtime_start" | "downtime_end"> {
  downtime_start: DateTime;
  downtime_end: DateTime;
}

export function parseCameraDowntimes(
  downtimes: CameraDowntimeOrig[]
): CameraDowntime[] {
  return downtimes.map((downtime) => ({
    ...downtime,
    downtime_start: DateTime.fromISO(downtime.downtime_start),
    downtime_end: DateTime.fromISO(downtime.downtime_end),
  }));
}
