import { Box } from "@mui/material";
import { ReactNode } from "react";

interface BottomFixedProps {
  bottom?: number;
  children: ReactNode;
}

export function BottomSticky({ children, bottom = 0 }: BottomFixedProps) {
  return (
    <Box
      position="sticky"
      bottom={bottom}
      left="0"
      width="100%"
      display="flex"
      justifyContent="center"
      zIndex={10}
    >
      {children}
    </Box>
  );
}
