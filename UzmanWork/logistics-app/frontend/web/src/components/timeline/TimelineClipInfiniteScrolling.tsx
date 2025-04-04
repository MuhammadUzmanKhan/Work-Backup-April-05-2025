import { Box } from "@mui/material";
import Grid, { type Grid2Props } from "@mui/material/Unstable_Grid2";
import { useMemo } from "react";
import { useElementIntersection } from "hooks/infinite_scrolling";
import { TimelineVideoClip } from "./TimelineVideoClip";
import { ChunkedClipsInterval } from "./utils";
import { getDetectionIntervalId } from "utils/detection_aggregation";

// How many clips to show per page. This is a bit more than a single row of clips.
const CLIP_PAGE_SIZE = 5;

interface TimelineClipInfiniteScrollingProps {
  chunk: ChunkedClipsInterval;
  gridProps?: Grid2Props;
}

// Infinite scrolling for TimelineVideoClip, loads more clips when the user scrolls down.
export function TimelineClipInfiniteScrolling({
  chunk,
  gridProps,
}: TimelineClipInfiniteScrollingProps) {
  const { page, setRef } = useElementIntersection();

  const detections = useMemo(() => {
    if (page * CLIP_PAGE_SIZE >= chunk.detections.length) {
      return chunk.detections;
    }
    return chunk.detections.slice(0, (page + 1) * CLIP_PAGE_SIZE);
  }, [chunk.detections, page]);

  return (
    <>
      {detections.map((clip) => (
        <Grid key={getDetectionIntervalId(clip)} {...gridProps}>
          <TimelineVideoClip
            clip={clip}
            thumbnail={clip.thumbnailData}
            clipStyle={{
              aspectRatio: "16 / 9",
              justifyContent: "center",
              alignItems: "center",
            }}
          />
        </Grid>
      ))}
      <Grid xs={12}>
        <Box ref={setRef} />
      </Grid>
    </>
  );
}
