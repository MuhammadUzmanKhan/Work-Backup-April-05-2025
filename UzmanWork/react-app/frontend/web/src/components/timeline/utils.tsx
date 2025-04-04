import {
  KinesisApiService,
  isDefined,
  isArchivedKinesisVideoClipRequest,
  isKinesisVideoClipRequest,
  KinesisVideoRequest,
} from "coram-common-utils";
import { Dispatch, SetStateAction } from "react";
import { Vector } from "two.js/src/vector";
import { replaceTimezone } from "utils/dates";
import { DateTime, Duration } from "luxon";
import { TimeInterval } from "utils/time";
import { DetectionAggregatedInterval } from "utils/detection_aggregation";
import type { Location } from "react-router-dom";
import { ClipData } from "./ClipsGrid";
import { type SortOrder } from "components/common/SortSelector";

// Chunk size in hours used to group detection clips in timeline
const EVENT_CLIPS_CHUNK_SIZE_HOURS = 2;
const ALERT_CLIPS_CHUNK_SIZE_HOURS = 24;
// Max time duration we can archive
export const MAX_ARCHIVE_DURATION = Duration.fromObject({
  minutes: 30,
});

export function downloadNameFromData(
  startTime: string,
  endTime: string,
  cameraLocation?: string,
  cameraName?: string
) {
  return `${cameraLocation ?? "unknown_location"}-${
    cameraName ?? "unknown_camera"
  }-${startTime}-${endTime}.mp4`.replace(/\s/, "_");
}

export async function requestClipFileUrlAndFileName(
  clipIsValid: boolean,
  kinesisOption: KinesisVideoRequest,
  locationName?: string,
  cameraName?: string
) {
  if (
    !isKinesisVideoClipRequest(kinesisOption) &&
    !isArchivedKinesisVideoClipRequest(kinesisOption)
  ) {
    throw new Error("Invalid Kinesis Video clip request");
  }

  if (!clipIsValid) {
    throw new Error("Invalid clip");
  }

  const url = await KinesisApiService.s3ClipUploadAndFetch(kinesisOption);
  const fileName = downloadNameFromData(
    kinesisOption.start_time,
    kinesisOption.end_time,
    locationName,
    cameraName
  );

  return { url, fileName };
}

export function getTimeLabel(
  startTime: DateTime,
  endTime: DateTime,
  timeFormat: string,
  useDate = true
) {
  const dateFormat = "MM/dd/yyyy";
  let startTimeStr = "";
  let endTimeStr = "";
  if (useDate) {
    if (!startTime.hasSame(endTime.setZone(startTime.zone), "day")) {
      // Date in both
      startTimeStr = startTime.toFormat(dateFormat + " " + timeFormat);
      endTimeStr = endTime.toFormat(dateFormat + " " + timeFormat);
    } else {
      // Date in start time only
      startTimeStr = startTime.toFormat(dateFormat + " " + timeFormat);
      endTimeStr = endTime.toFormat(timeFormat);
    }
  } else {
    // No date
    startTimeStr = startTime.toFormat(timeFormat);
    endTimeStr = endTime.toFormat(timeFormat);
  }
  return `${startTimeStr} - ${endTimeStr}`;
}

// Data structure to store the chunks of detection clips that are chunked based on time.
export interface ChunkedClipsInterval {
  startTime: DateTime;
  endTime: DateTime;
  detections: DetectionAggregatedInterval[];
}

export function chunkClips(
  detections: DetectionAggregatedInterval[],
  isAlertClips: boolean,
  sortOrder?: SortOrder
): ChunkedClipsInterval[] {
  // If isAlertClips, then chunk the clips by 24 hour interval and sort the
  // chuncks in reverse order so that the most recent chunk is displayed first.
  const chunkSizeInHours = isAlertClips
    ? ALERT_CLIPS_CHUNK_SIZE_HOURS
    : EVENT_CLIPS_CHUNK_SIZE_HOURS;
  const chunkOrderMultiplier = isAlertClips || sortOrder === "desc" ? -1 : 1;
  // Split the detection clips into chunks based on timestamps and sort chunk in time
  // order.
  const sortedChunks: ChunkedClipsInterval[] = detections
    .sort((a, b) => {
      return a.startTime < b.startTime ? -1 : 1;
    })
    .reduce((chunks: ChunkedClipsInterval[], detection) => {
      // Compute the matched chunk start time in hours for the given detection
      const chunkStartInHours =
        Math.floor(detection.startTime.hour / chunkSizeInHours) *
        chunkSizeInHours;
      // Set the chunk start time to be the same date as the detection
      const chunkStartTime = detection.startTime
        .startOf("day")
        .set({ hour: chunkStartInHours });
      // Set the chunk end time to be the end of the day if isAlertClips
      const chunkEndTimeAlert = detection.startTime.endOf("day");
      // Set the chunk end time to be the chunk start time + chunk size
      const chunkEndTime = isAlertClips
        ? chunkEndTimeAlert
        : chunkStartTime.plus({ hours: chunkSizeInHours });

      // Find the chunk in the list of chunks that matches to the given detection
      let matchedChunk = chunks.find(
        (chunk) =>
          chunk.startTime.hour === chunkStartTime.hour &&
          chunk.startTime.toISODate() === chunkStartTime.toISODate()
      );
      // If no chunk is found, create a new chunk for the given detection
      if (!matchedChunk) {
        matchedChunk = {
          startTime: chunkStartTime,
          endTime: chunkEndTime,
          detections: [],
        };
        chunks.push(matchedChunk);
      }
      // Add the detection to the matched chunk
      matchedChunk.detections.push(detection);
      return chunks;
    }, [])
    .sort((a, b) => {
      return chunkOrderMultiplier * (a.startTime < b.startTime ? -1 : 1);
    });
  return sortedChunks;
}

export function groupClipsByCamera(records: ClipData[]) {
  const groupedClips = new Map();

  for (const record of records) {
    const { camera } = record.camera;
    if (groupedClips.has(camera.name)) {
      groupedClips.get(camera.name).push(record);
    } else {
      groupedClips.set(camera.name, [record]);
    }
  }

  return groupedClips;
}

export enum ClipMode {
  EVENTS = "EVENTS",
  SEARCH_QUERY = "SEARCH_QUERY",
}

export interface ClipFilterState {
  timeInterval: TimeInterval;
  macAddresses: string[];
  objectFilter: string;
  searchQuery: string;
  mode: ClipMode;
  maxVideoLengthMin: number;
  // share the same representation as UserAlertSettingCreate:
  // if length is 2, this is a rectangle
  // if length is > 2, this is a polygon
  roi: Array<Array<number>>;
  sortOrder?: SortOrder;
}

export interface JourneyFilterState {
  timeInterval: {
    timeStart: string;
    timeEnd: string;
  };
  detectionTime: DateTime | null;
}

export function vectorToArray(vector: Vector): number[] {
  return [vector.x, vector.y];
}

function validateTimeInterval(
  startTime: DateTime,
  endTime: DateTime,
  maxTimeInterval?: Duration,
  maxTimeIntervalText?: string
): ErrorState {
  const result: ErrorState = {
    isStartTimeInvalid: false,
    isEndTimeInvalid: false,
    isSubmitError: false,
    errorMessage: "",
  };

  if (startTime > DateTime.now()) {
    result.isStartTimeInvalid = true;
    result.errorMessage = "Start time can't be in the future";
    return result;
  }

  if (endTime > DateTime.now()) {
    result.isEndTimeInvalid = true;
    result.errorMessage = "End time can't be in the future";
    return result;
  }

  if (startTime > endTime || startTime.hasSame(endTime, "second")) {
    result.isStartTimeInvalid = true;
    result.isEndTimeInvalid = true;
    result.errorMessage = "Start time must be before end time";
    return result;
  }

  if (isDefined(maxTimeInterval)) {
    const timeInterval = endTime.diff(startTime);
    if (timeInterval > maxTimeInterval) {
      const formattedDuration = maxTimeInterval.toHuman();
      result.isStartTimeInvalid = true;
      result.isEndTimeInvalid = true;
      result.errorMessage = `Max ${
        maxTimeIntervalText || "interval"
      } is ${formattedDuration}.`;
      return result;
    }
  }

  return result;
}

export function handleStartTimeChange(
  newTimeValue: DateTime | null,
  timezone: string,
  endTime: DateTime,
  setErrors: Dispatch<SetStateAction<ErrorState>>,
  setStartTime: (startTime: DateTime) => void,
  maxTimeInterval?: Duration,
  maxTimeIntervalText?: string,
  maxDurationBetweenStartTimeAndNow?: Duration
) {
  if (newTimeValue === null || !newTimeValue.isValid) {
    setErrors((prevState) => ({
      ...prevState,
      isStartTimeInvalid: true,
      errorMessage: "Start time is invalid",
    }));
    return;
  }
  if (isDefined(maxDurationBetweenStartTimeAndNow)) {
    const earliestStartTime = DateTime.now().minus(
      maxDurationBetweenStartTimeAndNow
    );
    if (newTimeValue < earliestStartTime) {
      setErrors((prevState) => ({
        ...prevState,
        isStartTimeInvalid: true,
        errorMessage: `Start time must be after ${earliestStartTime
          .setZone(timezone)
          .toFormat("d LLL yyyy")}.`,
      }));
      return;
    }
  }

  // Replace the timezone of the new time value with the timezone of the NVR
  const newStartTime = replaceTimezone(newTimeValue, timezone);

  // Need to validate both Start and End time as change in one can cause
  // the other to be invalid
  const validationResult = validateTimeInterval(
    newStartTime,
    endTime,
    maxTimeInterval,
    maxTimeIntervalText
  );
  setErrors((prevState) => ({
    ...prevState,
    isStartTimeInvalid: validationResult.isStartTimeInvalid,
    isEndTimeInvalid: validationResult.isEndTimeInvalid,
    errorMessage: validationResult.errorMessage,
  }));
  setStartTime(newStartTime);
}

export function handleEndTimeChange(
  newTimeValue: DateTime | null,
  timezone: string,
  startTime: DateTime,
  setErrors: Dispatch<SetStateAction<ErrorState>>,
  setEndTime: (newEndTime: DateTime) => void,
  maxTimeInterval?: Duration,
  maxTimeIntervalText?: string
) {
  if (newTimeValue === null || !newTimeValue.isValid) {
    setErrors((prevState) => ({
      ...prevState,
      isEndTimeInvalid: true,
      errorMessage: "End time is invalid",
    }));
    return;
  }

  // Replace the timezone of the new time value with the timezone of the NVR
  const newEndTime = replaceTimezone(newTimeValue, timezone);

  // Need to validate both Start and End time as change in one can cause
  // the other to be invalid
  const validationResult = validateTimeInterval(
    startTime,
    newEndTime,
    maxTimeInterval,
    maxTimeIntervalText
  );
  setErrors((prevState) => ({
    ...prevState,
    isStartTimeInvalid: validationResult.isStartTimeInvalid,
    isEndTimeInvalid: validationResult.isEndTimeInvalid,
    errorMessage: validationResult.errorMessage,
  }));
  setEndTime(newEndTime);
}

export interface ErrorState {
  isSubmitError: boolean;
  isStartTimeInvalid: boolean;
  isEndTimeInvalid: boolean;
  errorMessage: string;
}

export function parseMultiPlayerWasShown(location: Location): boolean {
  return !!location.state?.multiPlayerWasShown;
}
