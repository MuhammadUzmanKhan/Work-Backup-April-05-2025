import { VideocamOff as VideocamOffIcon } from "@mui/icons-material";
import type { SxProps } from "@mui/material";
import { Box, CircularProgress, Stack, styled, useTheme } from "@mui/material";
import { useDebounce } from "hooks/calls_limit";
import { DateTime } from "luxon";
import { useRef, useState } from "react";
import { ThumbnailResponseWithJSDate } from "utils/thumbnails_types";
import { useHoverThumbnail } from "../../hooks/useHoverThumbnail";
import { isDefined } from "coram-common-utils";

// Component to render an hover effect over it's children.
// Based on ratio, the left part will be darkened.
// A dashed line is shown at the current mouse position.
function HoverEffect({
  ratio,
  children,
  thumbnailStyle,
}: {
  ratio: number;
  children: React.ReactNode;
  thumbnailStyle?: SxProps;
}) {
  return (
    <Box width="100%" height="100%">
      <Box
        style={{
          width: `${ratio * 100}%`,
        }}
        sx={{
          PointerEvents: "none",
          position: "absolute",
          top: 0,
          left: 0,
          height: "100%",
          opacity: 0.1,
          backgroundColor: "black",
        }}
      />
      <Box
        style={{
          left: `${ratio * 100}%`,
          opacity: ratio <= 0 ? 0 : 0.75,
        }}
        sx={{
          PointerEvents: "none",
          position: "absolute",
          height: "100%",
          border: "1px dashed white",
        }}
      />
      <Stack
        direction="row"
        width="100%"
        height="100%"
        sx={{ ...thumbnailStyle }}
      >
        {children}
      </Stack>
    </Box>
  );
}

const ClipContainer = styled(Stack)(() => ({
  position: "relative",
  borderRadius: "7px",
  overflow: "hidden",
  height: "100%",
  width: "100%",
  backgroundColor: "gray",
  transition: "transform 0.1s ease-in-out",
  "&:hover": {
    transform: "scale(1.01)",
  },
}));

const ClipVideoBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  overflow: "hidden",
  backgroundColor: theme.palette.common.black,
  cursor: "pointer",
}));

interface ClipThumbnailPreviewProps {
  startTime: DateTime;
  endTime: DateTime;
  previewThumbnail: ThumbnailResponseWithJSDate | undefined;
  thumbnails: Map<string, ThumbnailResponseWithJSDate>;
  isFetchingThumbnail: boolean;
  bottomToolbar?: React.ReactNode;
  thumbnailStyle?: SxProps;
  onPlayClick: () => void;
  onHoverChange?: (hover: boolean) => void;
}

// Preview thumbnails for a clip on hover.
export function ClipThumbnailPreview({
  startTime,
  endTime,
  previewThumbnail,
  thumbnails,
  isFetchingThumbnail,
  bottomToolbar,
  thumbnailStyle,
  onPlayClick,
  onHoverChange,
}: ClipThumbnailPreviewProps) {
  const theme = useTheme();
  // Reference to the div element that contains the thumbnail.
  const boxRef = useRef<HTMLDivElement>(null);
  // Current width ratio of the mouse position in the div.
  const [widthRatio, setWidthRatio] = useState(0);

  const [mouseHover, setMouseHover] = useState(false);
  const debouncedHover = useDebounce(mouseHover, 100);

  const hoverThumbnail = useHoverThumbnail(
    thumbnails,
    startTime,
    endTime,
    debouncedHover,
    widthRatio,
    previewThumbnail
  );

  const imageLocalURLRef = useRef<string>();
  if (isDefined(hoverThumbnail)) {
    const prevUrl = imageLocalURLRef.current;
    imageLocalURLRef.current = URL.createObjectURL(hoverThumbnail.image_blob);
    URL.revokeObjectURL(prevUrl || "");
  }

  return (
    <ClipContainer>
      <ClipVideoBox
        ref={boxRef}
        onMouseEnter={() => {
          setMouseHover(true);
          onHoverChange?.(true);
        }}
        onMouseMove={(ev) => {
          if (boxRef.current === null) {
            return;
          }
          setWidthRatio(
            (ev.clientX - boxRef.current.getBoundingClientRect().left) /
              boxRef.current.getBoundingClientRect().width
          );
        }}
        onMouseLeave={() => {
          setMouseHover(false);
          onHoverChange?.(false);
          setWidthRatio(0);
        }}
        onClick={() => onPlayClick()}
      >
        <HoverEffect ratio={widthRatio} thumbnailStyle={thumbnailStyle}>
          {isDefined(imageLocalURLRef.current) ? (
            <img
              src={imageLocalURLRef.current}
              // Use the default style only if no style is provided.
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                verticalAlign: "middle",
              }}
            ></img>
          ) : isFetchingThumbnail ? (
            <CircularProgress />
          ) : (
            // If there is no thumbnail, we show an icon.
            <VideocamOffIcon
              fontSize="small"
              sx={{ color: theme.palette.common.black }}
            />
          )}
        </HoverEffect>
      </ClipVideoBox>
      {bottomToolbar}
    </ClipContainer>
  );
}
