import { Typography, Divider, Toolbar, Stack, IconButton } from "@mui/material";
import { KioskDrawerMode } from "./utils";
import { Close as CloseIcon } from "@mui/icons-material";

interface KioskDrawerHeaderProps {
  drawerMode: KioskDrawerMode;
  onCloseClick: () => void;
}

export function KioskDrawerHeader({
  drawerMode,
  onCloseClick,
}: KioskDrawerHeaderProps) {
  return (
    <>
      <Toolbar disableGutters component={Stack} p={2} gap={2}>
        <Stack
          minWidth="100%"
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h3">{`${drawerMode} Kiosk Wall`}</Typography>
          <IconButton
            sx={{ color: "neutral.1000", fontWeight: "bold" }}
            onClick={onCloseClick}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
        <Typography variant="body2">
          Select one or more walls. Selecting multiple walls will create a
          rotating kiosk.
        </Typography>
      </Toolbar>
      <Divider />
    </>
  );
}
