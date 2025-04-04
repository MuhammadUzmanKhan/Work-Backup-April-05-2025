import React, { useRef, useState } from "react";
import {
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { MoreVert as MoreVertIcon } from "@mui/icons-material";
import { DownloadButton } from "./DownloadButton";
import { ShareButton } from "./ShareButton";
import { ArchiveButton } from "./ArchiveButton";
import {
  LimitedUserRequired,
  RegularUserRequired,
} from "components/layout/RoleGuards";
import Checkbox from "@mui/material/Checkbox";
import { Wrapped } from "components/styled_components/Wrapped";

export interface ClipCheckboxProps {
  checked: boolean;
  onCheckBoxChange: (checked: boolean) => void;
}

interface ClipBottomToolbarProps {
  label: string;
  cameraName?: string;
  urlAndFileNameCb: () => Promise<{ url: string; fileName: string }>;
  onShareIconClick: React.Dispatch<React.SetStateAction<boolean>>;
  onArchiveIconClick: React.Dispatch<React.SetStateAction<boolean>>;
  checkBoxProps?: ClipCheckboxProps;
  extraToolbarItem?: React.ReactNode;
}

export function ClipBottomToolbar({
  label,
  cameraName = "",
  urlAndFileNameCb,
  onShareIconClick,
  onArchiveIconClick,
  checkBoxProps,
  extraToolbarItem,
}: ClipBottomToolbarProps) {
  const theme = useTheme();
  const anchorEl = useRef(null);

  // Whether the drop-down menu is open
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <Stack
        direction="row"
        width="100%"
        sx={{
          backgroundColor: "neutral.A100",
        }}
        alignItems="center"
        justifyContent="space-between"
        py={0.5}
        px={1.5}
      >
        <Stack alignItems="flex-start" minWidth={0}>
          {!!cameraName && (
            <Wrapped fontSize="12px" fontWeight={600} maxWidth="180px">
              {cameraName}
            </Wrapped>
          )}
          <Typography
            variant="body3"
            style={{ width: "100%", color: theme.palette.text.secondary }}
          >
            {label}
          </Typography>
        </Stack>
        {checkBoxProps && (
          <Checkbox
            checked={checkBoxProps.checked}
            onChange={(event) => {
              checkBoxProps.onCheckBoxChange(event.target.checked);
            }}
            inputProps={{ "aria-label": "controlled" }}
            size={"small"}
            color="secondary"
          />
        )}
        <IconButton sx={{ p: 0 }} onClick={() => setMenuOpen(true)}>
          <MoreVertIcon fontSize="small" ref={anchorEl} />
        </IconButton>
      </Stack>
      <Menu
        anchorEl={anchorEl.current}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <RegularUserRequired>
          <MenuItem>
            <DownloadButton
              urlAndFileNameCb={urlAndFileNameCb}
              enabledTooltip={"Download clip"}
              disabledTooltip={"Select an event to download a clip"}
              color={theme.palette.neutral?.[1000]}
            />
          </MenuItem>
          <MenuItem onClick={() => setMenuOpen(false)}>
            <ShareButton
              disabled={false}
              onShareIconClick={() => onShareIconClick(true)}
              iconColor={theme.palette.neutral?.[1000]}
            />
          </MenuItem>
        </RegularUserRequired>
        <LimitedUserRequired>
          <MenuItem onClick={() => setMenuOpen(false)}>
            <ArchiveButton
              iconColor={theme.palette.neutral?.[1000]}
              onClick={() => onArchiveIconClick(true)}
            />
          </MenuItem>
        </LimitedUserRequired>
        {extraToolbarItem && (
          <MenuItem onClick={() => setMenuOpen(false)}>
            {extraToolbarItem}
          </MenuItem>
        )}
      </Menu>
    </>
  );
}

export default ClipBottomToolbar;
