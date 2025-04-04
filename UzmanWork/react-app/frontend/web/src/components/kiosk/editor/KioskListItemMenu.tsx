import { Box, Menu, MenuItem, Stack, Tooltip, Typography } from "@mui/material";
import {
  EditOutlined as EditOutlinedIcon,
  HighlightOff as HighlightOffIcon,
  ShareOutlined as ShareOutlinedIcon,
} from "@mui/icons-material";

interface KioskListItemMenuProps {
  kioskId: number;
  kioskOwnerEmail: string;
  currentUserEmail: string;
  setOpenDrawer: React.Dispatch<React.SetStateAction<boolean>>;
  onRemoveKiosk: (kiosk_id: number) => Promise<void>;
  anchorEl: null | (EventTarget & SVGSVGElement);
  onClose: () => void;
  onShareClick: () => void;
}

export function KioskListItemMenu({
  kioskId,
  kioskOwnerEmail,
  currentUserEmail,
  setOpenDrawer,
  onRemoveKiosk,
  anchorEl,
  onClose,
  onShareClick,
}: KioskListItemMenuProps) {
  const openMenu = Boolean(anchorEl);
  const isUserOwner = kioskOwnerEmail === currentUserEmail;
  return (
    <Menu
      anchorEl={anchorEl}
      open={openMenu}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
    >
      <Tooltip
        title={isUserOwner ? "" : "Only the owner of the kiosk can edit it"}
      >
        <Box>
          <MenuItem
            onClick={() => {
              setOpenDrawer(true);
              onClose();
            }}
            disabled={!isUserOwner}
          >
            <Stack direction="row" gap={1}>
              <EditOutlinedIcon
                fontSize="small"
                sx={{
                  stroke: "neutral.100",
                }}
              />
              <Typography variant="body2">Edit</Typography>
            </Stack>
          </MenuItem>
        </Box>
      </Tooltip>
      <MenuItem
        onClick={async () => {
          await onRemoveKiosk(kioskId);
          onClose();
        }}
      >
        <Stack direction="row" gap={1}>
          <HighlightOffIcon
            fontSize="small"
            sx={{
              stroke: "neutral.100",
            }}
          />
          <Typography variant="body2">Delete</Typography>
        </Stack>
      </MenuItem>
      <MenuItem onClick={onShareClick}>
        <Stack direction="row" gap={1}>
          <ShareOutlinedIcon
            fontSize="small"
            sx={{
              stroke: "neutral.100",
            }}
          />
          <Typography variant="body2">Share</Typography>
        </Stack>
      </MenuItem>
    </Menu>
  );
}
