import { Box, Stack, Typography } from "@mui/material";
import { TrackImage } from "./TrackImage";
import { TrackThumbnailResponseWithJSDate } from "utils/journey_types";
import { useNavigate } from "react-router-dom";
import { GoBackButton } from "components/styled_components/StyledButton";

interface TrackItemProps {
  track: TrackThumbnailResponseWithJSDate;
  cameraName: string;
  timezone: string;
}

function TrackHeader({ track, cameraName, timezone }: TrackItemProps) {
  const navigate = useNavigate();
  const formattedTimestamp = track.thumbnail_data.timestamp
    .setZone(timezone)
    .toFormat("dd MMM, hh:mm:ss a");

  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Stack direction="row" gap={2} alignItems="center">
        <TrackImage width={130} imageUrl={track.signed_url} />
        <Box>
          <Typography variant="body1" sx={{ color: "neutral.1000" }}>
            {cameraName}
          </Typography>
          <Typography variant="body1" sx={{ color: "neutral.1000" }}>
            {formattedTimestamp}
          </Typography>
        </Box>
      </Stack>
      <GoBackButton onClick={() => navigate(-1)}>
        <Typography variant="body2"> Go Back</Typography>
      </GoBackButton>
    </Stack>
  );
}

export default TrackHeader;
