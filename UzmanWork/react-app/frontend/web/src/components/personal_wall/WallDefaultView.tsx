import { Button, Stack, Typography } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";

interface WallDefaultViewProps {
  onCreateWallClick: VoidFunction;
}

export function WallDefaultView({ onCreateWallClick }: WallDefaultViewProps) {
  return (
    <Stack justifyContent="center" alignItems="center" height="65vh">
      <img
        height="45px"
        src="/static/add_wall.png"
        style={{ maxWidth: "100%", marginBottom: "0.75rem" }}
      />
      <Typography variant="h2" mb="0.75rem">
        You haven’t created any wall yet
      </Typography>
      <Button
        variant="contained"
        color="secondary"
        onClick={onCreateWallClick}
        sx={{ borderRadius: "0.3rem" }}
      >
        <AddIcon sx={{ mr: "0.4rem", ml: "-0.4rem" }} />
        New Wall
      </Button>
    </Stack>
  );
}
