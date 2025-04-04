import { Box, Typography } from "@mui/material";
import { useRetrieveTracksThumbnail } from "hooks/journey";
import { DateTime } from "luxon";
import { TracksGrid } from "./TracksGrid";
import { TrackThumbnailResponseWithJSDate } from "utils/journey_types";

interface JourneyStartPanelProps {
  startTime: DateTime;
  endTime: DateTime;
  macAddress: string;
  onTrackClick: (track: TrackThumbnailResponseWithJSDate) => void;
}

export function JourneyStartPanel({
  startTime,
  endTime,
  macAddress,
  onTrackClick,
}: JourneyStartPanelProps) {
  const { data: tracksThumbnail, isFetched } = useRetrieveTracksThumbnail(
    macAddress,
    startTime,
    endTime
  );

  if (!isFetched || tracksThumbnail.length === 0) return <></>;

  return (
    <Box p={4} bgcolor="white">
      <Typography
        variant="h2"
        sx={{
          lineHeight: "24px",
          whiteSpace: "pre-wrap",
        }}
      >
        {`Here are the people seen on this camera between ${startTime.toLocaleString(
          DateTime.TIME_WITH_SECONDS
        )} and ${endTime.toLocaleString(
          DateTime.TIME_WITH_SECONDS
        )},\nSelect one of them to show the journey.`}
      </Typography>
      <TracksGrid tracks={tracksThumbnail} onClick={onTrackClick} />
    </Box>
  );
}
