import { Box, Stack, styled } from "@mui/material";

// video player (the whole component) container styles
export const VideoPlayerContainer = styled(Stack)(({ theme }) => ({
  height: "100%",
  width: "100%",
  borderRadius: "3px",
  borderColor: theme.palette.neutral?.[1000],
}));

// video container (just the video) styles
export const VideoContainer = styled(Box)({
  flexGrow: 1,
  position: "relative",
  overflow: "hidden",
});
