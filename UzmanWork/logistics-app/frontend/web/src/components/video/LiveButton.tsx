import { RadioButtonChecked as RadioButtonCheckedIcon } from "@mui/icons-material";
import { styled } from "@mui/material";
import { ChipSmall } from "./ChipSmall";

const LiveChip = styled(ChipSmall, {
  shouldForwardProp: (prop) => prop !== "isLive",
})<{ isLive: boolean }>(({ theme, isLive }) => ({
  "&.MuiChip-root": {
    borderRadius: "4px",
    color: "#fff",
    fontSize: "13px",
    backgroundColor: !isLive
      ? theme.palette.secondary.main
      : String(theme.palette.neutral?.[400]),
    pointerEvents: isLive ? "pointer" : "initial",
  },
}));

interface LiveButtonProps {
  isLive: boolean;
  onClick: () => void;
}

export function LiveButton({ isLive, onClick }: LiveButtonProps) {
  return (
    <LiveChip
      sx={{
        "& .MuiChip-icon": {
          transform: "scale(0.8)",
          color: "#fff",
        },
      }}
      isLive={isLive}
      icon={<RadioButtonCheckedIcon />}
      label={isLive ? "Live" : "Go Live"}
      onClick={onClick}
    />
  );
}
