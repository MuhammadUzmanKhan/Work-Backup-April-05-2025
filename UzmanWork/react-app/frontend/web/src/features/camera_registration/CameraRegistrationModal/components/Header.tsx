import { Stack, Typography } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
interface HeaderProps {
  onCloseClick: () => void;
}

export function Header({ onCloseClick }: HeaderProps) {
  return (
    <Stack direction="row" width="100%" justifyContent="space-between">
      <Typography variant="h2">Select Cameras</Typography>
      <CloseIcon onClick={onCloseClick} sx={{ cursor: "pointer" }} />
    </Stack>
  );
}
