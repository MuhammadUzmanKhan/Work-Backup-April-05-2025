import { Menu, useTheme } from "@mui/material";
import type { SxProps } from "@mui/material";
import { DeleteMenuItem } from "utils/menu_items";
import { useConfirmDelete } from "utils/confirm";

interface DeleteMenuProps {
  anchorEl: Element | null;
  open: boolean;
  deleteLabel: string;
  sx?: SxProps;
  setMenuOpen: (open: boolean) => void;
  onClose: () => void;
  onDelete: () => void;
}

export function DeleteMenu({
  anchorEl,
  open,
  deleteLabel,
  sx,
  setMenuOpen,
  onClose,
  onDelete,
}: DeleteMenuProps) {
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
