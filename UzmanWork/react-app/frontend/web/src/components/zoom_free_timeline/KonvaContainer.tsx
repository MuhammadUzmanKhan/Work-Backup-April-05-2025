import { Box } from "@mui/material";
import { forwardRef } from "react";

interface KonvaContainerProps extends React.ComponentProps<typeof Box> {
  children: React.ReactNode;
}

// This is a wrapper around the Konva Stage component. It is needed because
// of some unexpected interactions with the SizeObserver.
export const KonvaContainer = forwardRef(function KonvaContainer(
  props: KonvaContainerProps,
  ref: React.Ref<HTMLDivElement>
) {
  const { children, sx, ...boxProps } = props;
  return (
    <Box
      {...boxProps}
      sx={{
        position: "relative",
        ...sx,
      }}
      ref={ref}
    >
      <Box
        sx={{
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
      >
        {children}
      </Box>
    </Box>
  );
});
