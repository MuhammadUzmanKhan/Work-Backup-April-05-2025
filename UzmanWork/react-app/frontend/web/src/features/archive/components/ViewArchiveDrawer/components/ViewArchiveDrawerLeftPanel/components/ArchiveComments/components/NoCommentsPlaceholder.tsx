import { Stack, Typography } from "@mui/material";
import { NoCommentsIcon } from "./NoCommentsIcon";

export function NoCommentsPlaceholder() {
  return (
    <Stack pt={1} gap={1} width="100%" alignItems="center">
      <NoCommentsIcon
        sx={{
          width: "49px",
          height: "48px",
        }}
      />
      <Typography variant="body1" color="text.secondary">
        No comments yet
      </Typography>
    </Stack>
  );
}
