import { ReactNode } from "react";
import { Box } from "@mui/material";

export interface PanelContainerProps {
  height?: string;
}

export const PanelContainer = ({
  height,
  children,
}: PanelContainerProps & { children: ReactNode }) => (
  <Box
    sx={{
      height: height || "100%",
      backgroundColor: "common.white",
      padding: "0 0.3rem",
      overflowY: "auto",
    }}
  >
    {children}
  </Box>
);
