import { CircularProgress, Stack, Typography } from "@mui/material";

export function LoadingBox() {
  return (
    <Stack alignItems="center" justifyContent="center" height="100%" gap={2}>
      <CircularProgress color="secondary" size={48} />
      <Typography variant="h3" fontSize="16px" mb={1.5}>
        Finding Cameras
      </Typography>
    </Stack>
  );
}
