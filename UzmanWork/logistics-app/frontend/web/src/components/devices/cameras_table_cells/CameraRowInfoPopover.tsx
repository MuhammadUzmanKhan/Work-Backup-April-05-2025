import { Popover, type PopoverProps, Stack, Typography } from "@mui/material";
import { CameraResponse } from "coram-common-utils";

interface CameraRowInfoPopoverProps extends PopoverProps {
  stream: CameraResponse;
  open: boolean;
  onClose: () => void;
  anchorEl: HTMLButtonElement | null;
}

export function CameraRowInfoPopover({
  stream,
  open,
  onClose,
  anchorEl,
  ...props
}: CameraRowInfoPopoverProps) {
  return (
    <Popover open={open} anchorEl={anchorEl} onClose={onClose} {...props}>
      <Stack p={2}>
        <Stack
          direction="row"
          alignItems="center"
          gap={10}
          justifyContent="space-between"
        >
          <Typography variant="body2" color="textSecondary">
            NVR id :
          </Typography>
          <Typography variant="body2">{stream.camera.nvr_uuid}</Typography>
        </Stack>
        <Stack
          direction="row"
          alignItems="center"
          gap={1}
          justifyContent="space-between"
        >
          <Typography variant="body2" color="textSecondary">
            MAC address:
          </Typography>
          <Typography variant="body2">{stream.camera.mac_address}</Typography>
        </Stack>
        <Stack
          direction="row"
          alignItems="center"
          gap={1}
          justifyContent="space-between"
        >
          <Typography variant="body2" color="textSecondary">
            IP address:
          </Typography>
          <Typography variant="body2"> {stream.camera.ip}</Typography>
        </Stack>
      </Stack>
    </Popover>
  );
}
