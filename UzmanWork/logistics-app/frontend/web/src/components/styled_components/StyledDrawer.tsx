import { Drawer } from "@mui/material";
import type { ReactNode } from "react";
import type { DrawerProps } from "@mui/material";

interface StyledDrawerProps {
  width?: string;
  children: ReactNode;
}

export function StyledDrawer({
  width = "25rem",
  children,
  ...props
}: StyledDrawerProps & DrawerProps) {
  return (
    <Drawer
      anchor="right"
      PaperProps={{
        sx: {
          width: width,
          boxSizing: "border-box",
        },
      }}
      {...props}
    >
      {children}
    </Drawer>
  );
}
