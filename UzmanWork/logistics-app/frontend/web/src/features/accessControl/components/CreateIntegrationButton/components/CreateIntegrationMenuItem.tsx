import type { MenuItemProps } from "@mui/material";
import { MenuItem, Stack } from "@mui/material";
import { ChevronRight as ChevronRightIcon } from "@mui/icons-material";

export function CreateIntegrationMenuItem({
  children,
  sx,
  ...rest
}: MenuItemProps) {
  return (
    <MenuItem
      {...rest}
      sx={{
        display: "flex",
        justifyContent: "space-between",
        backgroundColor: "#f0f3fb",
        borderRadius: "8px",
        padding: "0.8rem",

        "&:not(:first-of-type)": {
          marginTop: "0.5rem",
        },

        ...sx,
      }}
    >
      <Stack direction="row" gap={1} alignItems="center">
        {children}
      </Stack>
      <ChevronRightIcon />
    </MenuItem>
  );
}
