import { Stack, Typography } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { ActionButton } from "components/styled_components/ActionButton";

const DRAWER_TOOLBAR_HEIGHT_PX = "54px";

interface ArchiveDrawerHeaderProps {
  onCloseClick: VoidFunction;
}

export function ViewArchiveDrawerHeader({
  onCloseClick,
}: ArchiveDrawerHeaderProps) {
  return (
    <Stack
      direction="row"
      py={2}
      pl={3}
      pr={2}
      justifyContent="space-between"
      alignItems="center"
      minHeight={DRAWER_TOOLBAR_HEIGHT_PX}
    >
      <Typography variant="h3">Archive Details</Typography>
      <ActionButton onClick={onCloseClick}>
        <CloseIcon fontSize="small" sx={{ color: "text.secondary" }} />
      </ActionButton>
    </Stack>
  );
}
