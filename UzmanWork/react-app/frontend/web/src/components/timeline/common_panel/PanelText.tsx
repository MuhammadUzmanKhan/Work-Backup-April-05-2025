import { Typography } from "@mui/material";

export const PanelText = ({ text }: { text: string | undefined }) => {
  if (!text) return null;

  return (
    <Typography variant="body2" sx={{ color: "neutral.1000" }}>
      {text}
    </Typography>
  );
};
