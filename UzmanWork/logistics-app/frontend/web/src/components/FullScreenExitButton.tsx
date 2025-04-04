import { Box, Stack } from "@mui/material";
import { CollapseIcon } from "icons/collapse-icon";
import { RefObject } from "react";

interface FullScreenExitButtonProps {
  containerRef: RefObject<HTMLDivElement>;
}

export function FullScreenExitButton({
  containerRef,
}: FullScreenExitButtonProps) {
  return (
    <Stack position="absolute" top="0" right="0" m={2} zIndex={2}>
      <Box
        sx={{
          background: "rgba(60, 62, 73, 0.5)",
          border: "1px solid #ffffff33",
          color: "white",
          borderRadius: "0.3rem",
          minHeight: "50px",
          minWidth: "50px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          "&:hover": {
            transform: "scale(1.01)",
            border: "1px solid #3FC79A",
          },
        }}
        onClick={() => {
          if (document.fullscreenElement === containerRef?.current) {
            document.exitFullscreen();
          }
        }}
      >
        <CollapseIcon />
      </Box>
    </Stack>
  );
}
