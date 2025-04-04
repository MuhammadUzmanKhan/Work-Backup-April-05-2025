import { AccessLogsResponse, isDefined } from "coram-common-utils";
import { DateTime } from "luxon";
import { AccessLogCameraInfoMap } from "../types";

const VIEWED_A_CLIP = "Viewed a clip";
const DOWNLOADED_A_CLIP = "Downloaded a clip";
const VIEWED_A_LIVE_STREAM = "Viewed a live stream";

export type AccessLogPlayableClipInfo = {
  type: "clip";
  macAddress: string;
  cameraId: number;
  startTime: DateTime;
  endTime: DateTime;
};

export type AccessLogPlayableLiveInfo = {
  type: "live";
  cameraId: number;
  macAddress: string;
};

export type AccessLogPlayableInfo =
  | AccessLogPlayableClipInfo
  | AccessLogPlayableLiveInfo;

export function getPlayableClipInfo(
  log: AccessLogsResponse,
  camerasInfoMap: AccessLogCameraInfoMap
): AccessLogPlayableInfo | null {
  if (!isDefined(log.details)) {
    return null;
  }
  if (!isDefined(log.details.mac_address)) {
    return null;
  }
  const macAddress = log.details.mac_address;
  const camera = camerasInfoMap.get(macAddress);
  if (!isDefined(camera)) {
    return null;
  }

  if ([VIEWED_A_CLIP, DOWNLOADED_A_CLIP].includes(log.action)) {
    return {
      type: "clip",
      cameraId: camera.id,
      macAddress: macAddress,
      startTime: DateTime.fromISO(log.details.start_time),
      endTime: DateTime.fromISO(log.details.end_time),
    };
  }
  if (log.action == VIEWED_A_LIVE_STREAM) {
    return {
      type: "live",
      cameraId: camera.id,
      macAddress: macAddress,
    };
  }
  return null;
}
