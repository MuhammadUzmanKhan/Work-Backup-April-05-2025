import { Typography } from "@mui/material";

export const PanelSectionHeader = ({
  title,
  color = "neutral.1000",
}: {
  title: string;
  color?: string;
}) => (
  <Typography variant="body2" sx={{ color: color }}>
    {title}
  </Typography>
);
