import { Box } from "@mui/material";
import { ReactNode } from "react";

export function AbsolutelyCentered({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }}
    >
      {children}
    </Box>
  );
}
