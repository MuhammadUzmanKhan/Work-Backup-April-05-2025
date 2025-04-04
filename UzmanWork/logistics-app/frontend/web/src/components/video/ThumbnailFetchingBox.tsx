import { Stack, Typography } from "@mui/material";

export default function ThumbnailFetchingBox() {
  return (
    <Stack
      bgcolor="rgba(0, 0, 0, .5)"
      width="100%"
      height="100%"
      justifyContent="center"
      alignItems="center"
    >
      <Typography variant="h2" color="white">
        Fetching thumbnails...
      </Typography>
    </Stack>
  );
}
