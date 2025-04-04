import { Button, Typography } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { CenteredStack } from "components/styled_components/CenteredStack";

export function KioskDefaultView({
  setOpenDrawer,
}: {
  setOpenDrawer: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <CenteredStack gap={2}>
      <img src="/static/kiosk_wall.png" style={{ maxWidth: "100%" }} />
      <Typography variant="h2">
        You haven’t created any Kiosk Walls yet
      </Typography>
      <Button
        color="secondary"
        variant="contained"
        sx={{ borderRadius: "0.3rem" }}
        onClick={() => setOpenDrawer(true)}
      >
        <AddIcon />
        Create Kiosk Wall
      </Button>
    </CenteredStack>
  );
}
