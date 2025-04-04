import { Menu, useTheme } from "@mui/material";
import type { SxProps } from "@mui/material";
import { EditMenuItem, DeleteMenuItem } from "utils/menu_items";
import { useConfirmDelete } from "utils/confirm";

interface EditMenuProps {
  anchorEl: Element | null;
  open: boolean;
  editLabel: string;
  deleteLabel: string;
  sx?: SxProps;
  setMenuOpen: (open: boolean) => void;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function EditMenu({
  anchorEl,
  open,
  editLabel,
  deleteLabel,
  sx,
  setMenuOpen,
  onClose,
  onEdit,
  onDelete,
}: EditMenuProps) {
  const theme = useTheme();
  const handleDelete = useConfirmDelete(onDelete);

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        sx={sx}
      >
        <EditMenuItem
          label={editLabel}
          sx={{ stroke: theme.palette.neutral?.[100] }}
          onClick={onEdit}
        />
        <DeleteMenuItem
          label={deleteLabel}
          sx={{ stroke: theme.palette.neutral?.[100] }}
          onClick={() => {
            setMenuOpen(false);
            handleDelete();
          }}
        />
      </Menu>
    </>
  );
}
