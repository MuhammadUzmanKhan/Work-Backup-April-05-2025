import * as Sentry from "@sentry/react";
import { Transaction } from "@sentry/types";
import { ClipFilterState } from "components/timeline/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "react-query";
import { formatDateTime } from "utils/dates";
import { DetectionAggregatedInterval } from "utils/detection_aggregation";
import { getClipsPreviewThumbnail } from "utils/thumbnails";
import { ThumbnailResponseWithJSDate } from "utils/thumbnails_types";

// Fetch thumbnails for the clips.
const EMPTY_THUMBNAIL_RESPONSE: (ThumbnailResponseWithJSDate | undefined)[] =
  [];
export function useClipsThumbnailQuery(
  cameraMacAddress: string,
  detections: DetectionAggregatedInterval[]
) {
  const lastDetectionTimestamp =
    detections.length > 0
      ? formatDateTime(detections[detections.length - 1].endTime)
      : "EMPTY-DETECTIONS";
  const query = useQuery(
    ["clips_thumbnail", cameraMacAddress, lastDetectionTimestamp],
    async () => {
      return await getClipsPreviewThumbnail(
        detections.map((det) => ({
          startTime: det.startTime,
          endTime: det.endTime,
          macAddress: cameraMacAddress,
        }))
      );
    },
    {
      retry: 3,
      staleTime: 1000 * 10,
      refetchOnWindowFocus: false,
      enabled: detections.length > 0,
    }
  );
  return { ...query, data: query.data || EMPTY_THUMBNAIL_RESPONSE };
}

// Filter clips based on the filter state.
export function useFilterClips(
  detections: DetectionAggregatedInterval[],
  clipFilter: ClipFilterState
) {
  // Store the clips that have been selected for rendering.
  const [selectedClips, setSelectedClips] = useState<
    DetectionAggregatedInterval[]
  >([]);

  // Update the selected clips when the filter state changes
  useEffect(() => {
    const filteredClips = detections.filter((event) => {
      // Object Filter
      if (
        clipFilter.objectFilter !== "All" &&
        event.detectionType &&
        event.detectionType !== clipFilter.objectFilter
      ) {
        return false;
      }
      // Time Filter
      const eventStart = event.startTime;
      const eventEnd = event.endTime;
      return (
        clipFilter.timeInterval.timeStart < eventStart &&
        clipFilter.timeInterval.timeEnd > eventEnd
      );
    });
    setSelectedClips(filteredClips);
  }, [clipFilter.timeInterval, clipFilter.objectFilter, detections]);

  return { selectedClips };
}

// Export a hook to start and finish a transaction for NLP search.
export function useSentryNLPSearch() {
  const queryTransaction = useRef<Transaction | null>(null);

  const onNLPSearchQuery = useCallback((searchQuery: string) => {
    queryTransaction.current = Sentry.startTransaction({
      name: "nlp-search",
      tags: { nlp_search_text: searchQuery },
    });
    console.debug("NLP query started:", searchQuery);
  }, []);

  const onNLPSearchResult = useCallback((numResults: number) => {
    if (queryTransaction.current != null) {
      queryTransaction.current.setTag("nlp_search_num_results", numResults);
    }
    console.debug("NLP query returned results:", numResults);
  }, []);

  const onNLPSearchDisplay = useCallback(() => {
    if (queryTransaction.current != null) {
      queryTransaction.current.finish();
    }
    console.debug("NLP query finished!");
  }, []);

  return {
    onNLPSearchQuery,
    onNLPSearchResult,
    onNLPSearchDisplay,
  };
}
