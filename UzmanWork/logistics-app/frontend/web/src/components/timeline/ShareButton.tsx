import { Stack, Tooltip, Typography, useTheme } from "@mui/material";
import { ShareOutlined as ShareOutlinedIcon } from "@mui/icons-material";

interface ShareButtonProps {
  disabled: boolean;
  onShareIconClick: () => void;
  iconColor?: string;
}

export function ShareButton({
  disabled,
  onShareIconClick,
  iconColor,
}: ShareButtonProps) {
  const theme = useTheme();
  return (
    <Stack
      gap={0.1}
      direction="row"
      alignItems="center"
      display="flex"
      onClick={() => {
        if (!disabled) {
          onShareIconClick();
        }
      }}
    >
      <Tooltip title={disabled ? "Select an event to share it" : "Share event"}>
        <ShareOutlinedIcon
          fontSize="large"
          sx={{
            color: disabled ? theme.palette.neutral?.[300] : iconColor,
            padding: "0.4rem",
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        />
      </Tooltip>
      <Typography variant="body2">Share</Typography>
    </Stack>
  );
}
