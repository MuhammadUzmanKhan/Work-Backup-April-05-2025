import { ReactNode } from "react";
import { Stack } from "@mui/material";
import type { SxProps } from "@mui/system";

interface PanelContentProps {
  children: ReactNode;
  sx?: SxProps;
}

export const PanelContent = ({ children, sx }: PanelContentProps) => (
  <Stack direction="column" p={1} sx={sx}>
    {children}
  </Stack>
);
