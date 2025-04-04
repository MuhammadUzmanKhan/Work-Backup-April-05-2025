import { MenuItem, Typography } from "@mui/material";
import { FavoriteIcon } from "icons/favorite-icon";

interface DashboardMenuItemProps {
  title: string;
  isFavorite: boolean;
  onClick: () => void;
}

export function DashboardMenuItem({
  title,
  isFavorite,
  onClick,
}: DashboardMenuItemProps) {
  return (
    <MenuItem onClick={onClick} sx={{ gap: 1 }}>
      <Typography variant="body2">{title}</Typography>
      {isFavorite && <FavoriteIcon color="#FF9900" />}
    </MenuItem>
  );
}
