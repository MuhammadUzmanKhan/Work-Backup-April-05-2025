import { CameraResponse, isDefined, NVRResponse } from "coram-common-utils";
import { Button, TableCell, TableRow, Typography } from "@mui/material";
import { DateTime } from "luxon";

interface NVRTableRowProps {
  nvr: NVRResponse;
  cameras: CameraResponse[];
  onNVRSettingsClick: (nvr: NVRResponse) => void;
}

export function NVRTableRow({
  nvr,
  cameras,
  onNVRSettingsClick,
}: NVRTableRowProps) {
  return (
    <>
      <TableRow>
        <TableCell>
          <Typography variant="body2">{nvr.uuid}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{nvr.org_name}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {isDefined(nvr.last_seen_time)
              ? DateTime.fromISO(nvr.last_seen_time).toLocaleString(
                  DateTime.DATETIME_MED_WITH_SECONDS
                )
              : "N/A"}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {cameras.filter((camera) => camera.camera.is_online).length}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{cameras.length}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {nvr.is_online ? "Online" : "Offline"}
          </Typography>
        </TableCell>
        <TableCell>
          <Button variant="text" onClick={() => onNVRSettingsClick(nvr)}>
            Settings
          </Button>
        </TableCell>
      </TableRow>
    </>
  );
}
