import { IconButton, Stack, TableCell, Typography } from "@mui/material";
import { AccessPointEventCameraInfo } from "features/accessControl/types";
import {
  KeyboardArrowDown as DownIcon,
  KeyboardArrowUp as UpIcon,
} from "@mui/icons-material";
import { AccessControlEventClip } from "./AccessControlEventClip";
import { isDefined } from "coram-common-utils";

interface FavoriteCameraTableCellProps {
  favoriteCamera: AccessPointEventCameraInfo | undefined;
  hasDetails: boolean;
  detailsOpen: boolean;
  toggleDetails: VoidFunction;
}

export function FavoriteCameraTableCell({
  favoriteCamera,
  hasDetails,
  detailsOpen,
  toggleDetails,
}: FavoriteCameraTableCellProps) {
  return (
    <TableCell>
      <Stack direction="row">
        {!isDefined(favoriteCamera) ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            width="9.25rem"
            height="5.25rem"
          >
            <Typography variant="body2">No Cameras Assigned</Typography>
          </Stack>
        ) : (
          <AccessControlEventClip clip={favoriteCamera.clip} />
        )}
        {hasDetails && (
          <IconButton size="small" onClick={toggleDetails}>
            {detailsOpen ? <UpIcon /> : <DownIcon />}
          </IconButton>
        )}
      </Stack>
    </TableCell>
  );
}
