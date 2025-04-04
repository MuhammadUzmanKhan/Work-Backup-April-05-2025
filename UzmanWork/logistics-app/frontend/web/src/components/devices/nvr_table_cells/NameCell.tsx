import { Box, Stack, Typography } from "@mui/material";
import { NVRResponse } from "coram-common-utils";

export function NameCell({ nvr }: { nvr: NVRResponse }) {
  return (
    <Stack direction="row" alignItems="center" gap={2}>
      <Box
        width={100}
        height={80}
        sx={{ backgroundColor: "neutral.A100", borderRadius: "0.5rem" }}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <img width={44} height={68} src="/static/desktop.png" />
      </Box>
      <Typography variant="body2">{nvr.uuid}</Typography>
    </Stack>
  );
}
