import {
  TrackThumbnailResponse,
  MctImage,
  DetectionObjectTypeCategory,
  JourneyInterval,
} from "coram-common-utils";
import { DateTime } from "luxon";
import { DetectionAggregatedInterval } from "./detection_aggregation";
import { formatDateTime } from "./dates";

export interface MctImageWithJSDate extends Omit<MctImage, "timestamp"> {
  timestamp: DateTime;
}

export interface TrackThumbnailResponseWithJSDate
  extends Omit<TrackThumbnailResponse, "thumbnail_data"> {
  thumbnail_data: MctImageWithJSDate;
}

export function convertTrackThumbnailResponse(
  response: TrackThumbnailResponse
): TrackThumbnailResponseWithJSDate {
  return {
    ...response,
    thumbnail_data: {
      ...response.thumbnail_data,
      timestamp: DateTime.fromISO(response.thumbnail_data.timestamp),
    },
  };
}

export function convertToTrackThumbnailResponse(
  response: TrackThumbnailResponseWithJSDate
): TrackThumbnailResponse {
  return {
    ...response,
    thumbnail_data: {
      ...response.thumbnail_data,
      timestamp: formatDateTime(response.thumbnail_data.timestamp),
    },
  };
}

export function isMctImage(value: unknown): value is MctImage {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === "object" &&
    "camera_mac_address" in value &&
    "timestamp" in value &&
    "track_id" in value &&
    "perception_stack_start_id" in value &&
    "s3_path" in value
  );
}

export function isTrackThumbnailResponse(
  value: unknown
): value is TrackThumbnailResponse {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === "object" &&
    "signed_url" in value &&
    "thumbnail_data" in value &&
    isMctImage(value.thumbnail_data)
  );
}

export function parseTrackThumbnailResponseWithJSDate(value: unknown) {
  if (isTrackThumbnailResponse(value)) {
    return convertTrackThumbnailResponse(value);
  }
  return null;
}

export function journeyIntervalToDetectionAggregatedInterval(
  interval: JourneyInterval,
  // TODO(@lberg): should not take timezone at this stage
  timezone: string
): DetectionAggregatedInterval {
  const startTime = DateTime.fromISO(interval.start_time).setZone(timezone);
  return {
    startTime,
    endTime: DateTime.fromISO(interval.end_time).setZone(timezone),
    detectionType: DetectionObjectTypeCategory.UNKNOWN,
    camera: interval.camera,
    thumbnailData: interval.thumbnail_s3_path
      ? {
          timestamp: startTime,
          s3_path: "",
          s3_signed_url: interval.thumbnail_s3_path,
        }
      : undefined,
  };
}
