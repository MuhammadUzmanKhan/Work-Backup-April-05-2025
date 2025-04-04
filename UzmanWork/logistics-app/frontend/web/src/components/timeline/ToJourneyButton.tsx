import { Box, Tooltip, Typography } from "@mui/material";
import { DirectionWalkIcon } from "icons/direction-walk-icon";

interface ToJourneyButtonProps {
  disabled?: boolean;
  onClick: () => void;
  iconColor?: string;
}

export function ToJourneyButton({
  disabled,
  onClick,
  iconColor,
}: ToJourneyButtonProps) {
  return (
    <Box
      alignItems="center"
      display="flex"
      onClick={() => {
        if (disabled) {
          return;
        }
        onClick();
      }}
      sx={{
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <Tooltip title={"Journey Path"}>
        <DirectionWalkIcon color={disabled ? "neutral.300" : iconColor} />
      </Tooltip>
      <Typography variant="body2">Journey Path</Typography>
    </Box>
  );
}
