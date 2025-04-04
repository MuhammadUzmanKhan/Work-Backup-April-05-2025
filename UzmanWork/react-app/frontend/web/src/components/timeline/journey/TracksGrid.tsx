import { Box, Typography } from "@mui/material";
import { TrackThumbnailResponseWithJSDate } from "utils/journey_types";
import { TrackImage } from "./TrackImage";

interface TracksGridProps {
  tracks: TrackThumbnailResponseWithJSDate[];
  onClick: (track: TrackThumbnailResponseWithJSDate) => void;
}

export function TracksGrid({ tracks, onClick }: TracksGridProps) {
  if (tracks.length === 0) {
    // TODO(@lberg): probably another component
    return <Typography variant="body1">{"No journey found"}</Typography>;
  }
  return (
    <Box
      display="grid"
      gridTemplateColumns="repeat(auto-fill,150px)"
      gap={2.2}
      pt={2}
    >
      {tracks.map((track, idx) => (
        <Box key={idx}>
          <TrackImage
            width={130}
            imageUrl={track.signed_url}
            onClick={() => onClick(track)}
          />
        </Box>
      ))}
    </Box>
  );
}
