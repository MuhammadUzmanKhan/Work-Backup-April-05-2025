import { Box, Typography } from "@mui/material";
import { Stack } from "@mui/system";
import { ReactNode } from "react";

interface EditReportSectionProps {
  title: string;
  children?: ReactNode;
}

export function EditReportSection({ title, children }: EditReportSectionProps) {
  return (
    <Box
      sx={{
        py: "1rem",
        px: "1.5rem",
        border: "1px solid #DFE0E6",
        borderRadius: "1rem",
        opacity: 1,
        background: "inherit",
      }}
    >
      <Stack gap={2}>
        <Typography variant="h2">{title}</Typography>
        {children}
      </Stack>
    </Box>
  );
}
