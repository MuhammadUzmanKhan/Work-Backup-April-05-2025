import { ReactNode } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
} from "@mui/material";
import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material";

interface CollapsiblePanelProps {
  title: string;
  children: ReactNode;
}

export function CollapsiblePanel({ title, children }: CollapsiblePanelProps) {
  return (
    <Accordion
      defaultExpanded={true}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "8px",
        boxShadow: "none",
        "&.Mui-expanded": { margin: 0 },
        "&:before": {
          display: "none",
        },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon fontSize="small" />}
        sx={{
          height: "48px",
          "&.Mui-expanded": { minHeight: "44px" },
        }}
      >
        <Typography variant="h3">{title}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ padding: 0, margin: 0 }}>
        <Stack p={2} pt={0.5} gap={2}>
          {children}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
