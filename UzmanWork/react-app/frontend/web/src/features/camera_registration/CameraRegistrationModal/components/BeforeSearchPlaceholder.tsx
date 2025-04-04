import { Box, Stack, Typography } from "@mui/material";
import { ExpandCircleDownRounded as ExpandCircleDownRoundedIcon } from "@mui/icons-material";
function BulletPoint({ text }: { text: string }) {
  return (
    <Stack direction="row" alignItems="center" gap={1}>
      <ExpandCircleDownRoundedIcon
        sx={{ rotate: "-90deg", color: "text.secondary" }}
      />
      <Typography variant="body2" color="gray">
        {text}
      </Typography>
    </Stack>
  );
}

export function BeforeSearchPlaceholderDesktop() {
  return (
    <Stack alignItems="center" justifyContent="center" height="100%">
      <Box>
        <Typography variant="h2" mb={1.5}>
          How to add cameras
        </Typography>
        <Stack gap={0.5}>
          <BulletPoint text="Select a location, cameras will appear as soon as they are detected" />
          <BulletPoint text="Select one or more cameras from the table" />
          <BulletPoint text="Activate the selected cameras using the Activate button" />
        </Stack>
      </Box>
    </Stack>
  );
}

export function BeforeSearchPlaceholderMobile() {
  return (
    <Stack alignItems="center" justifyContent="center" height="100%">
      <Box>
        <Typography variant="h3" mb={1.5}>
          How to add cameras
        </Typography>
        <Stack gap={0.5}>
          <BulletPoint text="Select Location" />
          <BulletPoint text="Select Cameras" />
          <BulletPoint text="Click on Activate" />
        </Stack>
      </Box>
    </Stack>
  );
}
