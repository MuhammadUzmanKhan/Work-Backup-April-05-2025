import {
  Checkbox,
  CircularProgress,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { WallDrawerItem } from "components/personal_wall/WallDrawerItem";
import { ThumbnailResponse } from "coram-common-utils";
import { MouseEvent, useState } from "react";
import { CameraFavoriteIcon } from "./CameraFavoriteIcon";

export interface CameraMenuItemProps {
  cameraName: string;
  cameraMacAddress: string;
  isSelected: boolean;
  isFavorite: boolean;
  thumbnail: ThumbnailResponse | undefined;
  isFetchingThumbnail: boolean;
  onCameraToggle: () => Promise<void>;
  onSetCameraFavorite: () => Promise<void>;
}

export function CameraMenuItem({
  cameraName,
  cameraMacAddress,
  isSelected,
  isFavorite,
  thumbnail,
  isFetchingThumbnail,
  onCameraToggle,
  onSetCameraFavorite,
}: CameraMenuItemProps) {
  const [isCameraTogglePending, setIsCameraTogglePending] = useState(false);

  async function handleCameraToggle(ev: MouseEvent<HTMLButtonElement>) {
    ev.stopPropagation();
    setIsCameraTogglePending(true);
    await onCameraToggle();
    setIsCameraTogglePending(false);
  }

  const [isHover, setIsHover] = useState(false);

  return (
    <MenuItem value={cameraMacAddress}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        width="100%"
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
      >
        <Stack
          direction="row"
          alignItems="center"
          gap={2}
          height="2.5rem"
          width="3.2rem"
        >
          <WallDrawerItem
            mostRecentThumbnail={thumbnail}
            isFetching={isFetchingThumbnail}
            imageSx={{
              maxHeight: "auto",
              maxWidth: "100%",
            }}
          />
          <Typography>{cameraName}</Typography>
        </Stack>
        <Stack
          height="33px"
          width="42px"
          direction="row"
          justifyContent="flex-end"
          alignItems="center"
          gap={1}
        >
          {isSelected && (
            <CameraFavoriteIcon
              isFavorite={isFavorite}
              isHover={isHover}
              onClick={onSetCameraFavorite}
            />
          )}
          {isCameraTogglePending ? (
            <Stack direction="column" justifyContent="center">
              <CircularProgress size={24} color="secondary" />
            </Stack>
          ) : (
            <Checkbox
              checked={isSelected}
              onClick={handleCameraToggle}
              color="secondary"
              sx={{ padding: "0" }}
            />
          )}
        </Stack>
      </Stack>
    </MenuItem>
  );
}
