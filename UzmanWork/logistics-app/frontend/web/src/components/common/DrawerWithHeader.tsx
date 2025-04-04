import { ReactNode } from "react";
import { Divider, Drawer, IconButton, Stack, Typography } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

interface DrawerWithHeaderProps {
  title: string;
  open: boolean;
  onClose: VoidFunction;
  width: string;
  children: ReactNode;
}

export function DrawerWithHeader({
  title,
  open,
  onClose,
  width,
  children,
}: DrawerWithHeaderProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      PaperProps={{
        sx: {
          width,
          p: 2,
          gap: 2,
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        width="100%"
      >
        <Typography variant="h3">{title}</Typography>
        <IconButton onClick={onClose} sx={{ p: 0 }}>
          <CloseIcon />
        </IconButton>
      </Stack>
      <Divider sx={{ width: "100%" }} />
      <Stack width="100%" height="100%" gap={1}>
        {children}
      </Stack>
    </Drawer>
  );
}
