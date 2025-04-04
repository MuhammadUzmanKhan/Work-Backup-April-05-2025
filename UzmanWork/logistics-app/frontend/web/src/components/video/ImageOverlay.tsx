import { Box } from "@mui/material";
import { ElementSize } from "hooks/element_size";
import { useRef } from "react";
import { VideocamOff as VideocamOffIcon } from "@mui/icons-material";
import ThumbnailFetchingBox from "./ThumbnailFetchingBox";

interface ImageOverlayProps {
  size: ElementSize;
  imageBlob?: Blob;
  isFetchingImage: boolean;
}

const FULL_WIDTH_STYLE = {
  width: "100%",
  maxHeight: "100%",
};

const FULL_HEIGHT_STYLE = {
  height: "100%",
  maxWidth: "100%",
};

export function ImageOverlay({
  size,
  imageBlob,
  isFetchingImage,
}: ImageOverlayProps) {
  const imageLocalURLRef = useRef<string>("");

  // Based on the ratio, determine if the image should be full width or full height
  const fullWidth = size.width > size.height;

  // Revoke the previous object URL and create a new one
  URL.revokeObjectURL(imageLocalURLRef.current);
  imageLocalURLRef.current = imageBlob ? URL.createObjectURL(imageBlob) : "";

  return (
    <Box
      height={size.height}
      width={size.width}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      {imageLocalURLRef.current !== "" ? (
        <img
          style={fullWidth ? FULL_WIDTH_STYLE : FULL_HEIGHT_STYLE}
          src={imageLocalURLRef.current}
        />
      ) : isFetchingImage ? (
        <ThumbnailFetchingBox />
      ) : (
        <VideocamOffIcon fontSize="large" sx={{ color: "white" }} />
      )}
    </Box>
  );
}
