import {
  AccessPointEventResponse as AccessPointEventResponseOrig,
  AccessPointResponse as AccessPointResponseOrig,
} from "coram-common-utils";
import { ClipData } from "components/timeline/ClipsGrid";
import { DateTime } from "luxon";

export interface AccessPointResponse
  extends Omit<AccessPointResponseOrig, "location_id"> {
  location_id: number | null;
}

export interface AccessPointEventResponse
  extends Omit<AccessPointEventResponseOrig, "time"> {
  time: DateTime;
}

export interface AccessPointEventCameraInfo {
  macAddress: string;
  isFavorite: boolean;
  timezone: string;
  clip?: ClipData;
}

export interface AugumentedAccessPointEventResponse
  extends AccessPointEventResponse {
  cameras: AccessPointEventCameraInfo[];
}

export function parseAccessControlPoint(
  accessControlPoint: AccessPointResponseOrig
): AccessPointResponse {
  return {
    ...accessControlPoint,
    location_id: accessControlPoint.location_id ?? null,
  };
}

export function parseAccessPointEvent(
  accessPointEvent: AccessPointEventResponseOrig
): AccessPointEventResponse {
  return {
    ...accessPointEvent,
    time: DateTime.fromISO(accessPointEvent.time),
  };
}
