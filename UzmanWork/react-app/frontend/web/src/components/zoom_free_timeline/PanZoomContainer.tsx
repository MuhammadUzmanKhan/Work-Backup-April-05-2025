import { Box } from "@mui/material";
import { ForwardedRef, forwardRef } from "react";

// This is a container which can be used to create a panzoom instance.
// This is NOT intended as the parent of what should be panned and zoomed.
// Instead, this is used to compute the transformation to be applied.
export const PanZoomContainer = forwardRef(function PanZoomContainer(
  _props,
  ref: ForwardedRef<HTMLElement>
) {
  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      <Box
        ref={ref}
        sx={{
          position: "absolute",
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      ></Box>
    </Box>
  );
});
