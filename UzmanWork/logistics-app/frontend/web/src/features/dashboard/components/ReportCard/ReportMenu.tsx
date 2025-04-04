import { IconButton, Menu, MenuItem, Typography } from "@mui/material";
import { MoreHoriz as MoreHorizIcon } from "@mui/icons-material";
import { useRef, useState } from "react";
import { useConfirmDelete } from "utils/confirm";
import { CopyIcon, EditIcon, RemoveIcon } from "icons";

interface ReportMenuProps {
  onEdit: VoidFunction;
  onClone: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export function ReportMenu({ onEdit, onClone, onDelete }: ReportMenuProps) {
  const anchorEl = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleDelete = useConfirmDelete(onDelete);

  return (
    <>
      <IconButton ref={anchorEl} size="small" onClick={() => setMenuOpen(true)}>
        <MoreHorizIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl.current}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem
          onClick={() => {
            setMenuOpen(false);
            onEdit();
          }}
        >
          <EditIcon fontSize="small" />
          <Typography variant="body2">Edit</Typography>
        </MenuItem>
        <MenuItem
          onClick={async () => {
            setMenuOpen(false);
            await onClone();
          }}
        >
          <CopyIcon fontSize="small" />
          <Typography variant="body2">Clone</Typography>
        </MenuItem>
        <MenuItem
          onClick={async () => {
            setMenuOpen(false);
            await handleDelete();
          }}
        >
          <RemoveIcon fontSize="small" />
          <Typography variant="body2">Delete</Typography>
        </MenuItem>
      </Menu>
    </>
  );
}
