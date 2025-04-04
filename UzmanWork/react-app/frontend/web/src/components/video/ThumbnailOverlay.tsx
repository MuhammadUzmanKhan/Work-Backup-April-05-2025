import { TriageDragContext } from "contexts/triage_drag_context";
import { useDebounce } from "hooks/calls_limit";
import { ElementSize } from "hooks/element_size";
import { useCurrentThumbnail } from "hooks/thumbnail_fetcher";
import { useContext, useMemo } from "react";
import { ImageOverlay } from "./ImageOverlay";
import { Duration } from "luxon";

const VISIBLE_PORTION_DEBOUNCE_MS = 300;
// NOTE(@lberg): We fetch a small number of thumbnails initially
// to not slow down the fine-grained ones.
const NUM_THUMBNAILS_TO_FETCH_INITIAL = 12;
const MAX_INITIAL_THUMBNAIL_DIFFERENCE = Duration.fromObject({
  minutes: 10,
});
const NUM_THUMBNAILS_TO_FETCH_VISIBLE = 100;

interface ThumbnailOverviewProps {
  size: ElementSize;
  macAddress: string;
}

// Fetch thumbnails and overlay the current one (based on the context)
export function ThumbnailOverlay({ size, macAddress }: ThumbnailOverviewProps) {
  const { triageDragStatus } = useContext(TriageDragContext);

  const debouncedVisiblePortion = useDebounce(
    useMemo(
      () => ({
        startRatio: triageDragStatus.visiblePortion.startRatio,
        endRatio: triageDragStatus.visiblePortion.endRatio,
      }),
      [
        triageDragStatus.visiblePortion.startRatio,
        triageDragStatus.visiblePortion.endRatio,
      ]
    ),
    VISIBLE_PORTION_DEBOUNCE_MS
  );

  const { thumbnail, stillFetching } = useCurrentThumbnail({
    cameraMacAddress: macAddress,
    timeInterval: triageDragStatus.timeInterval,
    visiblePortion: debouncedVisiblePortion,
    currentTime: triageDragStatus.time,
    numThumbsToFetchVisible: NUM_THUMBNAILS_TO_FETCH_VISIBLE,
    numThumbsToFetchInitial: NUM_THUMBNAILS_TO_FETCH_INITIAL,
    maxInitialThumbnailDifference: MAX_INITIAL_THUMBNAIL_DIFFERENCE,
    waitForInitialThumbnails: true,
  });

  return (
    <>
      {triageDragStatus.isDragging && (
        <ImageOverlay
          size={size}
          imageBlob={thumbnail?.image_blob}
          isFetchingImage={stillFetching}
        />
      )}
    </>
  );
}
