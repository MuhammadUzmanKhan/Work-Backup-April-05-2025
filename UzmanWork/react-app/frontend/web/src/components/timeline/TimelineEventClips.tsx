import { useFilterClips } from "hooks/timeline_clips";
import { useEffect, useState } from "react";
import {
  DetectionAggregatedInterval,
  aggregateDetections,
} from "utils/detection_aggregation";
import { TimelineClipGridMemoized } from "./TimelineClipGrid";
import { ClipFilterState } from "./utils";
import { augmentClipsWithThumbnails } from "utils/thumbnails";

interface TimelineEventClipsProps {
  detections: DetectionAggregatedInterval[];
  clipFilter: ClipFilterState;
}

export function TimelineEventClips({
  detections,
  clipFilter,
}: TimelineEventClipsProps) {
  const [aggregatedDetections, setAggregatedDetections] = useState<
    DetectionAggregatedInterval[]
  >([]);

  // Input detections, but with further aggregation.
  useEffect(() => {
    async function aggregateDetectionsWithThumbnails() {
      const aggregatedDetections = aggregateDetections(
        detections,
        clipFilter.objectFilter == "All",
        clipFilter.maxVideoLengthMin,
        clipFilter.maxVideoLengthMin
      );
      setAggregatedDetections(
        await augmentClipsWithThumbnails(aggregatedDetections)
      );
    }
    aggregateDetectionsWithThumbnails();
  }, [detections, clipFilter, setAggregatedDetections]);

  const { selectedClips } = useFilterClips(aggregatedDetections, clipFilter);

  // Render the memoized video clips
  return (
    <TimelineClipGridMemoized clips={selectedClips} clipFilter={clipFilter} />
  );
}
