import { Typography } from "@mui/material";

export const PanelErrorDisplay = ({
  errorMessage,
}: {
  errorMessage: string;
}) => {
  if (!errorMessage) return null;

  return (
    <Typography
      variant="body2"
      sx={{ color: "red" }}
    >{`Error: ${errorMessage}`}</Typography>
  );
};
