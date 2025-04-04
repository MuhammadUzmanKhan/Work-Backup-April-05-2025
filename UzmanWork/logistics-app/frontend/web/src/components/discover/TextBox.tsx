import Box from "@mui/material/Box";
import { Typography } from "@mui/material";

interface TextBoxProps {
  text: string;
}

export function TextBox({ text }: TextBoxProps) {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      sx={{
        backgroundColor: "neutral.A300",
        padding: "8px 20px",
        width: "218px",
        borderRadius: "10px",
      }}
    >
      <Typography variant="body1">{text}</Typography>
    </Box>
  );
}
