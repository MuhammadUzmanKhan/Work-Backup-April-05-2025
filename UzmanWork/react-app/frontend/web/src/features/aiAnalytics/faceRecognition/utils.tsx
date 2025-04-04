import {
  CancelablePromise,
  FaceOccurrenceResponse,
  CameraResponse,
  UniqueFaceResponse,
} from "coram-common-utils";
import {
  DetectionAggregatedInterval,
  aggregateDetectionsSeparatelyByCamera,
} from "utils/detection_aggregation";
import { getIntervalsFromFaceOccurrences } from "pages/analytics/utils";
import { augmentClipsWithThumbnails } from "utils/thumbnails";
import { atom } from "recoil";

export const selectedFaceState = atom<UniqueFaceResponse | null>({
  key: "selectedFaceState",
  default: null,
});

const CLIP_AGGREGATION_PARAMS = {
  groupAllObjects: true,
  maxGapMinutes: 1,
  maxAggregationMinutes: 5,
  enablePadding: false,
};

const CLIP_PADDING_PARAMS = {
  startPaddingSeconds: 3,
  endPaddingSeconds: 30,
};

export async function handleFaceOccurrencesUpdate(
  cameras: Map<string, CameraResponse>,
  fetchFaceOccurrences: () => CancelablePromise<Array<FaceOccurrenceResponse>>,
  onSuccess: (aggClips: DetectionAggregatedInterval[]) => void,
  requestRef: React.MutableRefObject<CancelablePromise<
    Array<FaceOccurrenceResponse>
  > | null>
) {
  if (requestRef.current) {
    // Cancel any previous requests
    requestRef.current.cancel();
  }
  const fetchRequest = fetchFaceOccurrences();

  requestRef.current = fetchRequest;
  const occurrences = await fetchRequest;
  requestRef.current = null;
  const intervals = getIntervalsFromFaceOccurrences(
    occurrences,
    cameras,
    CLIP_PADDING_PARAMS
  );

  // Aggregate the intervals if they are close in time separately for each
  // camera.
  const aggregatedClips = aggregateDetectionsSeparatelyByCamera(
    intervals,
    CLIP_AGGREGATION_PARAMS.groupAllObjects,
    CLIP_AGGREGATION_PARAMS.maxGapMinutes,
    CLIP_AGGREGATION_PARAMS.maxAggregationMinutes,
    CLIP_AGGREGATION_PARAMS.enablePadding
  );
  onSuccess(await augmentClipsWithThumbnails(aggregatedClips));
}
