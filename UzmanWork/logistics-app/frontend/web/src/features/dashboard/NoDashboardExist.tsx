import { Typography } from "@mui/material";
import { CenteredStack } from "components/styled_components/CenteredStack";
import { WindowIcon } from "icons/window-icon";
import { TOOLBAR_HEIGHT_PX } from "components/navbar/navbar";
import { CreateDashboardButton } from "./components";

export function NoDashboardExist() {
  return (
    <CenteredStack
      bgcolor="common.white"
      height={`calc(100vh - ${TOOLBAR_HEIGHT_PX}px)`}
      gap={2}
    >
      <WindowIcon />
      <Typography variant="h2">You haven’t added any dashboard yet</Typography>
      <CreateDashboardButton />
    </CenteredStack>
  );
}
