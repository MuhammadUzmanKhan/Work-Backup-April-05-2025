import { Button } from "@mui/material";
import { TrackThumbnailResponseWithJSDate } from "utils/journey_types";

interface JourneyDetailsPanelProps {
  onClose: () => void;
  track: TrackThumbnailResponseWithJSDate;
}

export function JourneyDetailsPanel({
  onClose,
  track,
}: JourneyDetailsPanelProps) {
  return (
    <>
      <Button onClick={onClose}>Close</Button>
      <div>Track: {JSON.stringify(track)}</div>
    </>
  );
}
