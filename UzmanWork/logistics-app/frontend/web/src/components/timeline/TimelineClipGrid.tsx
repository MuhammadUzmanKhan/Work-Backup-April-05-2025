import { Typography, type TypographyProps } from "@mui/material";
import Grid, { type Grid2Props } from "@mui/material/Unstable_Grid2";
import { Fragment, memo, useMemo } from "react";

import { TimelineClipInfiniteScrolling } from "./TimelineClipInfiniteScrolling";
import { chunkClips, ClipFilterState, getTimeLabel } from "./utils";
import { DetectionAggregatedInterval } from "utils/detection_aggregation";

interface TimelineClipGridProps {
  clips: DetectionAggregatedInterval[];
  labelProps?: TypographyProps;
  gridProps?: Grid2Props;
  clipFilter?: ClipFilterState | undefined;
}

export function TimelineClipGrid({
  clips,
  labelProps = {
    variant: "h2",
  },
  gridProps = {
    xs: 4,
  },
  clipFilter,
}: TimelineClipGridProps) {
  // Render the video clips
  // Note: for TimelineEventClips, there's filtering logic
  // which is not used in AlertClips.
  const isAlertClips = clipFilter === undefined ? true : false;

  const chunkedClips = useMemo(
    () => chunkClips(clips, isAlertClips, clipFilter?.sortOrder),
    [clips, isAlertClips, clipFilter?.sortOrder]
  );

  return (
    <Grid container spacing={2}>
      {chunkedClips.map((chunk, chunk_idx) => (
        <Fragment key={chunk_idx}>
          <Grid xs={12}>
            <Typography paddingLeft="0.7rem" {...labelProps}>
              {getTimeLabel(chunk.startTime, chunk.endTime, "t", isAlertClips)}
            </Typography>
          </Grid>
          <TimelineClipInfiniteScrolling chunk={chunk} gridProps={gridProps} />
        </Fragment>
      ))}
    </Grid>
  );
}

// This avoid slowing down rendering when we have a lot of clips.
// The component will only re-render if the props change (by shallow comparison)
// and not when the parent re-renders (default in react).
// However, it's not clear whether the slow down is expected even in that case.
export const TimelineClipGridMemoized = memo(TimelineClipGrid);
