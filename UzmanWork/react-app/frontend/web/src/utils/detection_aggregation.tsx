import {
  CameraResponse,
  DetectionObjectType,
  DetectionObjectTypeCategory,
} from "coram-common-utils";
import { DateTime, Duration } from "luxon";
import { ThumbnailResponseWithJSDate } from "./thumbnails_types";
import { ClipData } from "components/timeline/ClipsGrid";

// Clips shorter than this will be padded by 1 minute on each side.
const MIN_CLIP_DURATION_MINUTES = 1;

function breakLargeDetections(
  detections: DetectionAggregatedInterval[],
  maxDetectionMinutes: number
) {
  const maxDuration = Duration.fromDurationLike({
    minutes: maxDetectionMinutes,
  });
  return detections.reduce((acc, detection) => {
    let startTime = detection.startTime;
    while (startTime < detection.endTime) {
      const endDetectionDuration = detection.endTime.diff(startTime);
      const endTime = startTime.plus(
        endDetectionDuration.milliseconds < maxDuration.as("milliseconds")
          ? endDetectionDuration
          : maxDuration
      );
      acc.push({
        ...detection,
        startTime: startTime,
        endTime: endTime,
      });
      startTime = endTime;
    }

    return acc;
  }, [] as DetectionAggregatedInterval[]);
}

// TODO: Make DetectionAggregatedInterval generic and refactor
// aggregateDetections to be able to handle aggregating arbitrary extra data
// using a passed in predicate.
// https://orcamobilityai.atlassian.net/browse/VAS-1667
export interface DetectionAggregatedInterval {
  startTime: DateTime;
  endTime: DateTime;
  detectionType: DetectionObjectTypeCategory;
  camera: CameraResponse;
  thumbnailData?: ThumbnailResponseWithJSDate;
  faceOccurrenceId?: number;
}

export function clipDataFromDetectionAggregatedInterval(
  detection: DetectionAggregatedInterval
): ClipData {
  return {
    startTime: detection.startTime,
    endTime: detection.endTime,
    camera: detection.camera,
    thumbnailData: detection.thumbnailData,
    faceOccurrenceId: detection.faceOccurrenceId,
  };
}

// Utility function to get a unique id for a detection interval.
export function getDetectionIntervalId(detection: DetectionAggregatedInterval) {
  return `${
    detection.camera.camera.mac_address
  }_${detection.startTime.toISO()}_${detection.endTime.toISO()}_${
    detection.detectionType
  }`;
}

export function padDetectionInterval(
  detection: DetectionAggregatedInterval,
  minDurationMinutes: number = MIN_CLIP_DURATION_MINUTES
) {
  // Append 1 min to begin and end if the clip is too short
  const durationMinutes = detection.endTime
    .diff(detection.startTime)
    .as("minutes");

  if (durationMinutes >= minDurationMinutes) {
    return detection;
  }

  const padMinutes = minDurationMinutes / 2;
  let paddedStartTime = detection.startTime.minus({ minutes: padMinutes });
  // If the padded start time is before the beginning of the day, then
  // just use the start of the day.
  if (paddedStartTime < detection.startTime.startOf("day")) {
    paddedStartTime = detection.startTime.startOf("day").plus({ seconds: 1 });
  }

  let paddedEndTime = detection.endTime.plus({ minutes: padMinutes });
  // If the padded end time is after the end of the day, then
  // just use the end of the day.
  if (paddedEndTime > detection.endTime.endOf("day")) {
    paddedEndTime = detection.endTime.endOf("day").minus({ seconds: 1 });
  }

  return {
    ...detection,
    startTime: paddedStartTime,
    endTime: paddedEndTime,
  };
}

export function toDetectionType(
  detectionAggregatedType: DetectionObjectTypeCategory
): DetectionObjectType[] {
  if (detectionAggregatedType === DetectionObjectTypeCategory.PERSON) {
    return [
      DetectionObjectType.PERSON,
      DetectionObjectType.BICYCLE,
      DetectionObjectType.MOTORCYCLE,
    ];
  } else if (detectionAggregatedType === DetectionObjectTypeCategory.VEHICLE) {
    return [
      DetectionObjectType.BUS,
      DetectionObjectType.CAR,
      DetectionObjectType.TRUCK,
    ];
  } else if (detectionAggregatedType === DetectionObjectTypeCategory.ANIMAL) {
    return [
      DetectionObjectType.BIRD,
      DetectionObjectType.CAT,
      DetectionObjectType.DOG,
      DetectionObjectType.HORSE,
      DetectionObjectType.SHEEP,
      DetectionObjectType.COW,
      DetectionObjectType.ELEPHANT,
      DetectionObjectType.BEAR,
      DetectionObjectType.ZEBRA,
      DetectionObjectType.GIRAFFE,
    ];
  } else if (detectionAggregatedType === DetectionObjectTypeCategory.MOTION) {
    return [DetectionObjectType.MOTION];
  } else {
    return [];
  }
}

// Utility function to further aggregate detections.
// This also adds an index to each detection, which is used to match thumbnails
// to detections.
export function aggregateDetections(
  detections: DetectionAggregatedInterval[],
  groupAllObjects: boolean,
  maxGapMinutes: number,
  maxAggregationMinutes: number,
  enablePadding = true
) {
  // Break up detections that are longer than maxAggregationMinutes
  const updatedDetections = breakLargeDetections(
    detections,
    maxAggregationMinutes
  );

  // Detections are sorted by detectionType and startTime
  // Re-sort them by startTime if groupAllObjects is true
  if (groupAllObjects) {
    updatedDetections.sort((a, b) => {
      return a.startTime.diff(b.startTime).as("seconds");
    });
  }

  return updatedDetections
    .reduce((acc, detection) => {
      if (acc.length === 0) {
        return [detection];
      }
      if (
        !groupAllObjects &&
        detection.detectionType !== acc[acc.length - 1].detectionType
      ) {
        return [...acc, detection];
      }
      const gapPrevMinutes = detection.startTime
        .diff(acc[acc.length - 1].endTime)
        .as("minutes");
      const totalTimeMinutes = detection.endTime
        .diff(acc[acc.length - 1].startTime)
        .as("minutes");
      if (
        gapPrevMinutes <= maxGapMinutes &&
        totalTimeMinutes <= maxAggregationMinutes
      ) {
        const lastEl = acc[acc.length - 1];
        // Update the detectionType to unknown if we are merging different types.
        let curDetectionType = lastEl.detectionType;
        if (curDetectionType != detection.detectionType) {
          curDetectionType = DetectionObjectTypeCategory.UNKNOWN;
        }
        const { faceOccurrenceId, thumbnailData } = lastEl.thumbnailData
          ? {
              // Use the face occurrence id as the face_occurrence_id for the
              // aggregated interval if this occurrence has a person_s3_signed_url (so
              // here, the thumbnailData is not null), which means it was the highest
              // quality in their group.
              faceOccurrenceId: lastEl.faceOccurrenceId,
              // Take the first non-null thumbnail data
              thumbnailData: lastEl.thumbnailData,
            }
          : {
              faceOccurrenceId: detection.faceOccurrenceId,
              thumbnailData: detection.thumbnailData,
            };

        const newDetection: DetectionAggregatedInterval = {
          ...lastEl,
          endTime: detection.endTime,
          detectionType: curDetectionType,
          thumbnailData: thumbnailData,
          faceOccurrenceId: faceOccurrenceId,
        };
        return [...acc.slice(0, acc.length - 1), newDetection];
      }

      return [...acc, detection];
    }, [] as DetectionAggregatedInterval[])
    .map((detection) => {
      return enablePadding ? padDetectionInterval(detection) : detection;
    }, []);
}

// Utility function to further aggregate detections, separately for each camera.
// This also adds an index to each detection, which is used to match thumbnails
// to detections.
export function aggregateDetectionsSeparatelyByCamera(
  detections: DetectionAggregatedInterval[],
  groupAllObjects: boolean,
  maxGapMinutes: number,
  maxAggregationMinutes: number,
  enablePadding = true
) {
  // First group the intervals by camera.
  const intervalsByCamera = new Map<string, DetectionAggregatedInterval[]>();
  detections.forEach((interval) => {
    if (!intervalsByCamera.has(interval.camera.camera.mac_address)) {
      intervalsByCamera.set(interval.camera.camera.mac_address, []);
    }
    intervalsByCamera.get(interval.camera.camera.mac_address)?.push(interval);
  });

  const aggregatedClips = new Array<DetectionAggregatedInterval>();
  // Aggregate the intervals for each camera.
  intervalsByCamera.forEach((intervals) => {
    const aggregated = aggregateDetections(
      intervals,
      groupAllObjects,
      maxGapMinutes,
      maxAggregationMinutes,
      enablePadding
    );
    aggregatedClips.push(...aggregated);
  });
  // Sort clips by start time descending.
  aggregatedClips.sort((a, b) => b.startTime.diff(a.startTime).as("seconds"));
  return aggregatedClips;
}
