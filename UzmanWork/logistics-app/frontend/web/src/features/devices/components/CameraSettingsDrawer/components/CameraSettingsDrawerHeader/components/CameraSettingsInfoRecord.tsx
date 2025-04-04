import { Stack, Typography } from "@mui/material";

interface CameraSettingsInfoRecordProps {
  primaryText: string;
  secondaryText: string;
}

export function CameraSettingsInfoRecord({
  primaryText,
  secondaryText,
}: CameraSettingsInfoRecordProps) {
  return (
    <Stack>
      <Typography
        variant="body1"
        sx={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          color: "#83889E",
        }}
      >
        {primaryText}
      </Typography>
      <Typography variant="body2">{secondaryText}</Typography>
    </Stack>
  );
}
