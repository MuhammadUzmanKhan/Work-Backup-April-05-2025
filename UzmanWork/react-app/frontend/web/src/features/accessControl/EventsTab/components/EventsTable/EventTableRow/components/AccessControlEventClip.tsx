import { Box, Stack, Typography } from "@mui/material";
import { TimelineVideoClip } from "components/timeline/TimelineVideoClip";
import { ClipData } from "components/timeline/ClipsGrid";

interface AccessControlEventClipProps {
  clip: ClipData | undefined;
}

export function AccessControlEventClip({ clip }: AccessControlEventClipProps) {
  return (
    <Box width="9.25rem" borderRadius="0.4rem" sx={{ aspectRatio: "16/9" }}>
      {clip?.thumbnailData ? (
        <TimelineVideoClip
          clip={clip}
          thumbnail={clip.thumbnailData}
          hideBottomToolbar
        />
      ) : (
        <Stack
          justifyContent="center"
          alignItems="center"
          width="100%"
          height="100%"
          borderRadius="0.4rem"
          bgcolor="rgba(60, 62, 73, 0.11)"
        >
          <Typography variant="body2">Video not found</Typography>
        </Stack>
      )}
    </Box>
  );
}
