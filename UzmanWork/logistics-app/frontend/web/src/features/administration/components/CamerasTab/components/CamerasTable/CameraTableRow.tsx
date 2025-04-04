import { CameraResponse } from "coram-common-utils";
import { Button, TableCell, TableRow, Typography } from "@mui/material";

interface CameraTableRowProps {
  camera: CameraResponse;
  onCameraSettingsClick: (nvr: CameraResponse) => void;
}

export function CameraTableRow({
  camera,
  onCameraSettingsClick,
}: CameraTableRowProps) {
  return (
    <>
      <TableRow>
        <TableCell>
          <Typography variant="body2">{camera.camera.name}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{camera.org_name}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{camera.nvr_name}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{camera.location}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{camera.camera.mac_address}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{camera.camera.ip}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{camera.camera.vendor}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{`${camera.camera.height} x ${camera.camera.width}`}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{camera.camera.fps}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {camera.camera.is_online ? "Online" : "Offline"}
          </Typography>
        </TableCell>
        <TableCell>
          <Button
            variant="text"
            onClick={() => onCameraSettingsClick(camera)}
            sx={{ p: 0 }}
          >
            Settings
          </Button>
        </TableCell>
      </TableRow>
    </>
  );
}
