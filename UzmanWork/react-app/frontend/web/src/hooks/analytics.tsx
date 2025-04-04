import {
  AnalyticsResponse,
  DetectionObjectTypeCategory,
  TrackingAnalyticsInterval,
} from "coram-common-utils";
import { DateTime } from "luxon";
import { useMemo } from "react";
import { formatDateTime } from "utils/dates";

interface ObjectDetectionAnalytics {
  objectCounts: number[];
  objectTimestamps: string[];
}

export function useObjectDetectionAnalytics(
  analytics: AnalyticsResponse,
  objectType: DetectionObjectTypeCategory,
  timezone: string
): ObjectDetectionAnalytics {
  const { objectCounts, objectTimestamps } = useMemo(() => {
    let objectCounts: number[] = [];

    switch (objectType) {
      case DetectionObjectTypeCategory.PERSON:
        objectCounts = analytics.detection_analytics.map(
          (item) => item.person_count
        );
        break;
      case DetectionObjectTypeCategory.VEHICLE:
        objectCounts = analytics.detection_analytics.map(
          (item) => item.vehicle_count
        );
        break;
      default: {
        const _exhaustiveCheck:
          | DetectionObjectTypeCategory.MOTION
          | DetectionObjectTypeCategory.ANIMAL
          | DetectionObjectTypeCategory.UNKNOWN = objectType;
        throw new Error(`Unhandled objectType: ${_exhaustiveCheck}`);
      }
    }

    // NOTE(@lberg): What we are doing here is replacing the timezone
    // to UTC, as apex chart does not seem to work otherwise.
    // 20-10-2023 10:30:08 UTC-7 -> 20-10-2023 10:30:08 UTC
    const objectTimestamps = analytics.detection_analytics.map((item) =>
      formatDateTime(
        DateTime.fromISO(item.time, { zone: timezone }).setZone("UTC", {
          keepLocalTime: true,
        })
      )
    );

    return { objectCounts, objectTimestamps };
  }, [analytics, objectType, timezone]);

  return {
    objectCounts,
    objectTimestamps,
  };
}

function formatDuration(duration_in_sec: number) {
  const hours = Math.floor(duration_in_sec / 3600);
  const minutes = Math.floor((duration_in_sec % 3600) / 60);
  const seconds = Math.floor(duration_in_sec % 60);

  let duration_str = "";
  if (hours > 0) {
    duration_str += `${hours}h `;
  }
  if (minutes > 0) {
    duration_str += `${minutes}m `;
  }
  duration_str += `${seconds}s`;
  return duration_str;
}

export function useObjectTrackingAnalytics(
  trackingAnalytics: TrackingAnalyticsInterval[],
  objectType: DetectionObjectTypeCategory
) {
  const objectTrackingAnalytics = useMemo(() => {
    const objectTrackInfo = trackingAnalytics.find(
      (track) => track.object_category === objectType
    );

    if (!objectTrackInfo) {
      return {
        num_tracks: 0,
        avg_track_duration: formatDuration(0),
        max_track_duration: formatDuration(0),
      };
    }

    return {
      num_tracks: objectTrackInfo.num_tracks,
      avg_track_duration: formatDuration(objectTrackInfo.avg_track_duration),
      max_track_duration: formatDuration(objectTrackInfo.max_track_duration),
    };
  }, [trackingAnalytics, objectType]);
  return objectTrackingAnalytics;
}
