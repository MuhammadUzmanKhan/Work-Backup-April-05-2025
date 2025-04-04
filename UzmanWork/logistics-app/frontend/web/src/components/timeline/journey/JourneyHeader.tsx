import { Stack, Typography } from "@mui/material";
import { BackButton } from "components/navbar/utils/BackButton";

export function JourneyHeader() {
  return (
    <Stack direction="row" alignItems="center">
      <BackButton />
      <Typography
        variant="h2"
        sx={{
          color: "neutral.1000",
        }}
      >
        Journey Path
      </Typography>
    </Stack>
  );
}
