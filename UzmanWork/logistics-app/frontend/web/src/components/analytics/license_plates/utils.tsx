import {
  CameraResponse,
  CancelablePromise,
  DetectionObjectTypeCategory,
  LicensePlateOccurrencesResponse,
} from "coram-common-utils";
import { DateTime } from "luxon";
import { DetectionAggregatedInterval } from "utils/detection_aggregation";
import { augmentClipsWithThumbnails } from "utils/thumbnails";

const CLIP_PADDING_PARAMS = {
  startPaddingSeconds: 3,
  endPaddingSeconds: 30,
};

/**
 * Generates a list of detection intervals from a given set of license plate
 * occurrences. Each interval represents a time range around the occurrence of
 * a license plate detection, extended by specified padding durations before and
 * after the actual occurrence time.
 */
export function getIntervalsFromLicensePlateOccurrences(
  cameras: CameraResponse[],
  occurrences: Array<LicensePlateOccurrencesResponse>,
  clipPaddingParams: { startPaddingSeconds: number; endPaddingSeconds: number }
): DetectionAggregatedInterval[] {
  const camerasMap = new Map<string, CameraResponse>();
  cameras.forEach((cam) => camerasMap.set(cam.camera.mac_address, cam));

  return occurrences.reduce(
    (
      intervals: DetectionAggregatedInterval[],
      occurrence: LicensePlateOccurrencesResponse
    ) => {
      const camera = camerasMap.get(occurrence.license_plate.mac_address);

      if (!camera) {
        // Skip if camera is not found
        return intervals;
      }

      const startTime = DateTime.fromISO(occurrence.license_plate.time)
        .setZone(camera.timezone)
        .minus({ seconds: clipPaddingParams.startPaddingSeconds });

      const endTime = DateTime.fromISO(occurrence.license_plate.time)
        .setZone(camera.timezone)
        .plus({ seconds: clipPaddingParams.endPaddingSeconds });

      intervals.push({
        startTime,
        endTime,
        detectionType: DetectionObjectTypeCategory.VEHICLE,
        camera,
      });

      return intervals;
    },
    []
  );
}

export async function handleLicensePlateOccurrencesUpdate(
  cameras: CameraResponse[],
  fetchLicensePlateOccurrences: () => CancelablePromise<
    Array<LicensePlateOccurrencesResponse>
  >,
  onSuccess: (aggClips: DetectionAggregatedInterval[]) => void,
  requestRef: React.MutableRefObject<CancelablePromise<
    Array<LicensePlateOccurrencesResponse>
  > | null>
) {
  if (requestRef.current) {
    // Cancel any previous requests
    requestRef.current.cancel();
  }
  const fetchRequest = fetchLicensePlateOccurrences();

  requestRef.current = fetchRequest;
  const occurrences = await fetchRequest;
  const clips = getIntervalsFromLicensePlateOccurrences(
    cameras,
    occurrences,
    CLIP_PADDING_PARAMS
  );
  // TODO (yawei): Add aggregation logic same as face occurrences
  onSuccess(await augmentClipsWithThumbnails(clips));
}
