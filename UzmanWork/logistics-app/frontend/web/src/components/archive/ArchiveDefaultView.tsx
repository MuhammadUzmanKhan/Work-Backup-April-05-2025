import { Button, Typography } from "@mui/material";
import { PlayArrow as PlayArrowIcon } from "@mui/icons-material";
import { CenteredStack } from "components/styled_components/CenteredStack";

export function ArchiveDefaultView() {
  return (
    <CenteredStack gap={2}>
      <img
        height="45px"
        src="/static/add_wall.png"
        style={{ maxWidth: "100%" }}
      />
      <Typography variant="h2">You haven’t created archive yet</Typography>
      <Button
        variant="contained"
        color="secondary"
        sx={{
          borderRadius: "0.3rem",
          gap: "0.5rem",
        }}
        target="_blank"
        href="https://www.loom.com/share/5b974621b53d46a59045d587cf99f972?t=32"
      >
        <PlayArrowIcon />
        See how to add archive
      </Button>
    </CenteredStack>
  );
}
