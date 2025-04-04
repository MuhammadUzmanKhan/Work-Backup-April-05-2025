import { MenuItem, Stack, Typography } from "@mui/material";
import type { SxProps } from "@mui/material";
import BorderColorOutlinedIcon from "@mui/icons-material/BorderColorOutlined";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";

interface MenuItemsProps {
  label: string;
  sx?: SxProps;
  onClick: () => void;
}
export function EditMenuItem({ label, sx, onClick }: MenuItemsProps) {
  return (
    <MenuItem onClick={onClick}>
      <Stack direction="row" alignItems="center" gap={0.6}>
        <BorderColorOutlinedIcon fontSize="small" sx={sx} />
        <Typography variant="body2">{label}</Typography>
      </Stack>
    </MenuItem>
  );
}

export function DeleteMenuItem({ label, sx, onClick }: MenuItemsProps) {
  return (
    <MenuItem onClick={onClick}>
      <Stack direction="row" alignItems="center" gap={0.6}>
        <HighlightOffIcon fontSize="small" sx={sx} />
        <Typography variant="body2">{label}</Typography>
      </Stack>
    </MenuItem>
  );
}
