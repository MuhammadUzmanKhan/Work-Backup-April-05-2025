import { Menu, MenuItem } from "@mui/material";
import { InfoOutlined as InfoOutlinedIcon } from "@mui/icons-material";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { type PopoverProps } from "@mui/material/Popover";

interface DasbhboardActionsMenuProps {
  anchorEl?: PopoverProps["anchorEl"];
  onClose: VoidFunction;
  onEditDashboard: VoidFunction;
  onDeleteDashboard: () => Promise<void>;
}

export function DasbhboardActionsMenu({
  anchorEl,
  onClose,
  onEditDashboard,
  onDeleteDashboard,
}: DasbhboardActionsMenuProps) {
  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      transformOrigin={{
        vertical: -4,
        horizontal: "left",
      }}
    >
      <MenuItem sx={{ gap: 1 }} onClick={onEditDashboard}>
        <InfoOutlinedIcon sx={{ color: "#3C3E49", fontSize: "medium" }} />
        Dashboard Details
      </MenuItem>
      <MenuItem sx={{ gap: 1 }} onClick={onDeleteDashboard}>
        <HighlightOffIcon sx={{ color: "#3C3E49", fontSize: "medium" }} />
        Delete
      </MenuItem>
    </Menu>
  );
}
