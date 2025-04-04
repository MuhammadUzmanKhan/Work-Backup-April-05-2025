import { Box, Divider } from "@mui/material";
import { CameraResponse } from "coram-common-utils";
import { useEffect, useState } from "react";
import { ClipFilters, CLIP_FILTER_OBJECT_TYPES } from "./TimelineClipFilters";
import { DetectionAggregatedInterval } from "utils/detection_aggregation";
import { ClipMode, ClipFilterState } from "./utils";
import { TimelineEventClips } from "./TimelineEventClips";
import { TimelineQueryClips } from "./TimelineQueryClips";
import { DrawingState } from "utils/drawing";
import { DateTime } from "luxon";
import { TimeInterval } from "utils/time";

const MAX_SEARCH_RESULTS = 25;

const INITIAL_CLIP_FILTER_STATE: ClipFilterState = {
  timeInterval: {
    timeStart: DateTime.now().startOf("day"),
    timeEnd: DateTime.now().endOf("day"),
  },
  macAddresses: [],
  objectFilter: CLIP_FILTER_OBJECT_TYPES[0],
  searchQuery: "",
  mode: ClipMode.EVENTS,
  maxVideoLengthMin: 5,
  roi: [],
  sortOrder: "asc",
};

interface TimelineClipsProps {
  detections: DetectionAggregatedInterval[];
  currentStream: CameraResponse;
  timeInterval: TimeInterval;
  drawingState: DrawingState;
  videoTime: DateTime;
}

export function TimelineClips({
  detections,
  currentStream,
  timeInterval,
  drawingState,
  videoTime,
}: TimelineClipsProps) {
  // Store the current filter state.
  const [clipFilterState, setClipFilterState] = useState<ClipFilterState>({
    ...INITIAL_CLIP_FILTER_STATE,
    macAddresses: [currentStream.camera.mac_address],
  });

  // Update the time range, keep the rest as it is.
  useEffect(() => {
    setClipFilterState((prev) => ({
      ...prev,
      timeInterval: timeInterval,
    }));
  }, [timeInterval, setClipFilterState]);

  return (
    <Box minHeight="500px" sx={{ backgroundColor: "common.white" }} p={3}>
      <Divider />
      <ClipFilters
        clipFilterState={clipFilterState}
        setClipFilterState={setClipFilterState}
      />
      {clipFilterState.mode === ClipMode.EVENTS ? (
        <TimelineEventClips
          detections={detections}
          clipFilter={clipFilterState}
        />
      ) : (
        <TimelineQueryClips
          currentMacAddress={currentStream.camera.mac_address}
          clipFilter={clipFilterState}
          maxSearchResults={MAX_SEARCH_RESULTS}
          drawingState={drawingState}
          videoTime={videoTime}
        />
      )}
    </Box>
  );
}
