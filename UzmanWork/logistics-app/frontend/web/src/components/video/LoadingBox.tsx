import { Box, CircularProgress } from "@mui/material";
import type { SxProps } from "@mui/material";
import { ABSOLUTE_CENTER } from "theme/consts";

// Box to show when the video is loading or we are fetching the url
export function LoadingBox({ sx }: { sx?: SxProps }) {
  return (
    <Box
      justifyContent="center"
      alignItems="center"
      display="flex"
      sx={{ ...ABSOLUTE_CENTER, pointerEvents: "none", ...sx }}
    >
      <CircularProgress color="secondary" />
    </Box>
  );
}
