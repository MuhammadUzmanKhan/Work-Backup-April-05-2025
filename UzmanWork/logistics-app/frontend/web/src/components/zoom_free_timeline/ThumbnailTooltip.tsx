import {
  VideocamOff as VideocamOffIcon,
  ArrowDropDown as ArrowDropDownIcon,
} from "@mui/icons-material";
import {
  Box,
  CircularProgress,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import { grey } from "@mui/material/colors";
import { useDebounce } from "hooks/calls_limit";
import { DateTime, Duration } from "luxon";
import { useMemo, useRef } from "react";
import { VisiblePortion } from "./utils";
import { TimeInterval } from "utils/time";
import { useCurrentThumbnail } from "hooks/thumbnail_fetcher";

// Debouncing threshold to update the visible portion
const VISIBLE_PORTION_DEBOUNCE_MS = 300;

// NOTE(@lberg): Fetch a small number of initial thumbnails
// so we can show them quickly.
const NUM_THUMBS_TO_FETCH_INITIAL = 24;
const MAX_INITIAL_THUMBNAIL_DIFFERENCE = Duration.fromObject({
  hours: 1,
});
const NUM_THUMBNAILS_TO_FETCH_VISIBLE = 200;

const IMAGE_BOX_WIDTH_REM = 31.5;
const IMAGE_BOX_HEIGHT_REM = 23.5;

function DownArrow({
  color,
  offsetStart,
  visible,
}: {
  color: string;
  offsetStart: number;
  visible: boolean;
}) {
  const width = 28;
  const height = 14;

  return (
    <ArrowDropDownIcon
      sx={{
        position: "absolute",
        left: `min(max(calc(${offsetStart * 100}% - ${
          width / 2
        }px),  0.3rem), calc(100% - ${width}px - 0.3rem))`,
        top: -16,
        width: `${width}px`,
        height: `${height}px`,
        visibility: visible ? "visible" : "hidden",
        zIndex: 101,
        color: color,
      }}
      viewBox="7 10 10 5"
    />
  );
}

export interface Tooltip {
  // Whether the tooltip is visible or not
  visible: boolean;
  // The offset of the tooltip from the left of the chart between 0 and 1
  offsetStart: number;
  // Time of the where the tooltip is currently pointing
  tooltipTime: DateTime;
}

export function ThumbnailTooltip({
  tooltip,
  cameraMacAddress,
  visiblePortion,
  timeInterval,
}: {
  tooltip: Tooltip;
  cameraMacAddress: string;
  visiblePortion: VisiblePortion;
  timeInterval: TimeInterval;
}) {
  const theme = useTheme();
  const { visible, offsetStart, tooltipTime } = tooltip;
  // Keep track of the last image URL to avoid memory leaks
  const imageLocalURLRef = useRef<string>("");

  const debouncedVisiblePortion = useDebounce(
    useMemo(
      () => ({
        startRatio: visiblePortion.startRatio,
        endRatio: visiblePortion.endRatio,
      }),
      [visiblePortion.startRatio, visiblePortion.endRatio]
    ),
    VISIBLE_PORTION_DEBOUNCE_MS
  );

  const { thumbnail, isError, stillFetching } = useCurrentThumbnail({
    cameraMacAddress,
    timeInterval: timeInterval,
    visiblePortion: debouncedVisiblePortion,
    currentTime: tooltipTime,
    numThumbsToFetchInitial: NUM_THUMBS_TO_FETCH_INITIAL,
    numThumbsToFetchVisible: NUM_THUMBNAILS_TO_FETCH_VISIBLE,
    maxInitialThumbnailDifference: MAX_INITIAL_THUMBNAIL_DIFFERENCE,
    waitForInitialThumbnails: true,
  });

  // Revoke the previous object URL and create a new one
  URL.revokeObjectURL(imageLocalURLRef.current);
  imageLocalURLRef.current = thumbnail
    ? URL.createObjectURL(thumbnail.image_blob)
    : "";

  const imageBoxWidthRem = 31.5;
  const imageBoxHeightRem = 23.5;

  const thumbnailNotFound =
    thumbnail === undefined && (isError || !stillFetching);

  return (
    <>
      <Paper
        elevation={16}
        style={{
          visibility: visible ? "visible" : "hidden",
          position: "absolute",
          top: `calc(-${IMAGE_BOX_HEIGHT_REM}rem - 44px)`,
          left: `min(max(calc(${offsetStart * 100}% - ${
            IMAGE_BOX_WIDTH_REM / 2
          }rem),  0rem), calc(100% - ${IMAGE_BOX_WIDTH_REM}rem))`,
          zIndex: 100,
          padding: "2px",
        }}
      >
        {/* Hidden is for rounded borders on the elements inside while preserving padding */}
        <Box sx={{ overflow: "hidden", borderRadius: "8px" }}>
          {/* Use a box to ensure we have the same size both when there is or
        there isn't a thumbnail */}
          <Box
            width={`${imageBoxWidthRem}rem`}
            height={`${imageBoxHeightRem}rem`}
            sx={{
              position: "relative",
              backgroundColor: "neutral.200",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {thumbnail !== undefined ? (
              <img
                src={imageLocalURLRef.current}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  verticalAlign: "middle",
                }}
              ></img>
            ) : thumbnailNotFound ? (
              <VideocamOffIcon
                fontSize="small"
                sx={{ color: theme.palette.common.black }}
              />
            ) : (
              <CircularProgress />
            )}
          </Box>
          <Typography
            variant="body3"
            sx={{
              textAlign: "center",
              color: "white",
              backgroundColor: grey[600],
              paddingY: "0.35rem",
            }}
          >
            {thumbnail
              ? thumbnail.time
                  .setZone(timeInterval.timeStart.zone)
                  .toLocaleString(DateTime.TIME_WITH_SECONDS)
              : thumbnailNotFound
              ? "Thumbnail not found"
              : "Fetching..."}
          </Typography>
        </Box>
      </Paper>
      <DownArrow
        color={grey[600]}
        offsetStart={offsetStart}
        visible={visible}
      />
    </>
  );
}
