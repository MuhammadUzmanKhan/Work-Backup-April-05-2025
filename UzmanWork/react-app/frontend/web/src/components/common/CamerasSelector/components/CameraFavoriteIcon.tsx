import { Star as StarIcon, StarOutlined as StarOutlinedIcon } from "icons";
import { CircularProgress, IconButton } from "@mui/material";
import { MouseEvent, useState } from "react";

interface CameraFavoriteIconProps {
  isFavorite: boolean;
  isHover: boolean;
  onClick: () => Promise<void>;
}

export function CameraFavoriteIcon({
  isFavorite,
  isHover,
  onClick,
}: CameraFavoriteIconProps) {
  const [isCameraFavoritePending, setIsCameraFavoritePending] = useState(false);

  async function handleClick(ev: MouseEvent<HTMLButtonElement>) {
    ev.stopPropagation();
    setIsCameraFavoritePending(true);
    await onClick();
    setIsCameraFavoritePending(false);
  }

  if (isFavorite) {
    return <StarIcon color="primary" />;
  }

  if (isHover || isCameraFavoritePending) {
    return (
      <IconButton
        onClick={handleClick}
        disabled={isCameraFavoritePending}
        sx={{ padding: 0 }}
      >
        {isCameraFavoritePending ? (
          <CircularProgress size={24} color="secondary" />
        ) : (
          <StarOutlinedIcon />
        )}
      </IconButton>
    );
  }

  return null;
}
