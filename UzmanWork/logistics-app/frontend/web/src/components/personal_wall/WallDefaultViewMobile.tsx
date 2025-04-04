import { Stack, Typography } from "@mui/material";

export function WallDefaultViewMobile() {
  return (
    <Stack
      justifyContent="center"
      alignItems="center"
      minHeight="calc(100vh - 64px)"
      gap={1}
    >
      <img
        height="45px"
        src="/static/add_wall.png"
        style={{ maxWidth: "100%" }}
      />
      <Typography variant="h2">You haven’t created any wall yet</Typography>
      <Typography variant="body2">
        Please use Coram on desktop to create walls
      </Typography>
    </Stack>
  );
}
