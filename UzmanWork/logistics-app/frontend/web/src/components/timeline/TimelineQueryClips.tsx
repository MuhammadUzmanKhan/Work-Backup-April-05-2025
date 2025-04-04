import { CircularProgress, Stack, Typography } from "@mui/material";
import {
  CancelError,
  CancelablePromise,
  DetectionObjectTypeCategory,
  TextSearchResponseMessageBase,
  TextSearchService,
  isDefined,
  useCamerasMap,
} from "coram-common-utils";
import { useSentryNLPSearch } from "hooks/timeline_clips";
import { DateTime } from "luxon";
import { useContext, useEffect, useRef, useState } from "react";
import { formatDateTime } from "utils/dates";
import {
  DetectionAggregatedInterval,
  padDetectionInterval,
} from "utils/detection_aggregation";
import { DrawingMode, DrawingState } from "utils/drawing";
import { ClipData, ClipsGrid } from "./ClipsGrid";
import {
  ClipFilterState,
  ClipMode,
  groupClipsByCamera,
  vectorToArray,
} from "./utils";
import { NotificationContext } from "contexts/notification_context";
import { augmentClipsWithThumbnails } from "utils/thumbnails";

interface TimelineQueryClipsProps {
  currentMacAddress?: string;
  clipFilter: ClipFilterState;
  maxSearchResults: number;
  videoTime?: DateTime;
  drawingState?: DrawingState;
  displayDate?: boolean;
  colSize?: number;
  setNumSearchResults?: (numResults: number) => void;
  setExternalIsLoading?: (isLoading: boolean) => void;
}

// Clips shorter than 10s this will be padded by 5s on each side.
const MIN_CLIP_DURATION_MINUTES = 0.17;

export function TimelineQueryClips({
  currentMacAddress: currentMacAddress,
  clipFilter,
  maxSearchResults,
  videoTime,
  drawingState,
  displayDate,
  colSize = 2.4,
  setNumSearchResults,
  setExternalIsLoading,
}: TimelineQueryClipsProps) {
  const { setNotificationData } = useContext(NotificationContext);

  const { data: camerasMap } = useCamerasMap({ refetchOnWindowFocus: false });
  // Store the loading status of the component.
  const [loading, setLoading] = useState(false);
  // Store the clips that have been selected for rendering.
  const [selectedClips, setSelectedClips] = useState<ClipData[]>([]);
  // Whether to display the camera name in the clip.
  const [displayCameraName, setDisplayCameraName] = useState(false);
  // Store the request for the text search so that we can cancel it if the
  // user changes the filter before the request completes.
  const textSearchRequestRef = useRef<CancelablePromise<
    Array<TextSearchResponseMessageBase>
  > | null>(null);

  const videoTimeRef = useRef(videoTime);
  videoTimeRef.current = videoTime;

  const { onNLPSearchDisplay, onNLPSearchQuery, onNLPSearchResult } =
    useSentryNLPSearch();

  useEffect(() => {
    async function fetchDetectionClips() {
      let roi = undefined;
      if (drawingState?.drawingMode) {
        const roi_rect =
          drawingState.drawingMode === DrawingMode.Rectangle &&
          drawingState.rects.length !== 0
            ? [
                vectorToArray(drawingState.rects[0].coord_min),
                vectorToArray(drawingState.rects[0].coord_max),
              ]
            : undefined;
        roi =
          drawingState.drawingMode === DrawingMode.Polygon &&
          drawingState.polygons.length !== 0
            ? drawingState.polygons[0].map((vector) => vectorToArray(vector))
            : roi_rect;
      }
      // TODO (VAS-2717): Separate timeline search query from discovery search query.
      // TODO(@lberg): please let's do this
      let textSearchRequest;
      if (isDefined(currentMacAddress)) {
        textSearchRequest = TextSearchService.performSingleCameraSearch({
          text_query: clipFilter.searchQuery,
          mac_address: currentMacAddress,
          start_time: formatDateTime(clipFilter.timeInterval.timeStart),
          end_time: formatDateTime(clipFilter.timeInterval.timeEnd),
          top_k: maxSearchResults,
          roi_polygon: roi,
        });
      } else {
        // Skip search request if no mac addresses are selected.
        if (clipFilter.macAddresses.length === 0) {
          setNumSearchResults?.(0);
          return [];
        }

        textSearchRequest = TextSearchService.performMultiCameraSearch({
          text_query: clipFilter.searchQuery,
          mac_addresses: clipFilter.macAddresses,
          start_time: formatDateTime(clipFilter.timeInterval.timeStart),
          end_time: formatDateTime(clipFilter.timeInterval.timeEnd),
          top_k: maxSearchResults,
        });
      }

      if (textSearchRequestRef.current) {
        textSearchRequestRef.current.cancel();
      }

      textSearchRequestRef.current = textSearchRequest;

      const searchResults = await textSearchRequest;

      if (!searchResults) {
        throw new Error("Failed to fetch search query data");
      }

      onNLPSearchResult(searchResults.length);
      setNumSearchResults?.(searchResults.length);

      // Chunk the top-k returned clips into a chunked clips array.
      const selectedClips: DetectionAggregatedInterval[] = searchResults
        .slice(0, maxSearchResults)
        .reduce((acc, result) => {
          const camera = camerasMap.get(result.mac_address);
          if (!camera) {
            return acc;
          }
          const aggregatedInterval = {
            startTime: DateTime.fromISO(result.timestamp)
              .minus({
                seconds: 5,
              })
              .setZone(camera.timezone),
            endTime: DateTime.fromISO(result.timestamp)
              .plus({
                seconds: 30,
              })
              .setZone(camera.timezone),
            detectionType: DetectionObjectTypeCategory.UNKNOWN,
            camera: camera,
          };
          return [...acc, aggregatedInterval];
        }, [] as DetectionAggregatedInterval[]);

      return selectedClips;
    }

    async function fetchClips() {
      setLoading(true);
      if (setExternalIsLoading) {
        setExternalIsLoading(true);
      }
      onNLPSearchQuery(clipFilter.searchQuery);
      try {
        let selectedClips = [];
        selectedClips = await fetchDetectionClips();
        setDisplayCameraName(false);

        selectedClips = selectedClips.map((clip) => {
          return padDetectionInterval(clip, MIN_CLIP_DURATION_MINUTES);
        });
        // Fetch the thumbnails for the selected clips.
        try {
          selectedClips = await augmentClipsWithThumbnails(selectedClips);
        } catch (error) {
          console.error(error);
        }
        setSelectedClips(selectedClips);

        setLoading(false);
        if (setExternalIsLoading) {
          setExternalIsLoading(false);
        }
        onNLPSearchDisplay();
      } catch (error) {
        if (error instanceof CancelError) {
          return;
        }
        console.error(error);
        setNotificationData({
          message: "Can't load search results. Try searching again.",
          severity: "error",
        });
        setSelectedClips([]);

        setLoading(false);
        if (setExternalIsLoading) {
          setExternalIsLoading(false);
        }
        onNLPSearchDisplay();
      }
    }

    fetchClips();
  }, [
    clipFilter.searchQuery,
    clipFilter.macAddresses,
    currentMacAddress,
    camerasMap,
    clipFilter.timeInterval,
    drawingState?.drawingMode,
    drawingState?.rects,
    drawingState?.polygons,
    maxSearchResults,
    onNLPSearchResult,
    onNLPSearchQuery,
    onNLPSearchDisplay,
    setNumSearchResults,
    setExternalIsLoading,
    setNotificationData,
  ]);

  return (
    <Stack
      direction="row"
      minHeight="300px"
      alignItems="center"
      justifyContent="center"
    >
      {loading ? (
        <CircularProgress />
      ) : clipFilter.mode === ClipMode.EVENTS ? (
        Array.from(groupClipsByCamera(selectedClips).entries()).map(
          ([cameraName, groupedClips]) => (
            <Stack key={cameraName}>
              <Typography variant="h2" py={2}>
                {cameraName}
              </Typography>
              <ClipsGrid
                clips={groupedClips}
                displayDate={displayDate}
                displayCameraName={false}
              />
            </Stack>
          )
        )
      ) : (
        <ClipsGrid
          clips={selectedClips}
          displayDate={displayDate}
          displayCameraName={displayCameraName}
          colSize={colSize}
        />
      )}
    </Stack>
  );
}
