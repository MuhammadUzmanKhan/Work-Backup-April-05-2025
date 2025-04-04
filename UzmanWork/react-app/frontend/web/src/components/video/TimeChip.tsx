import { FiberManualRecord as FiberManualRecordIcon } from "@mui/icons-material";
import { grey } from "@mui/material/colors";
import { ChipSmall } from "./ChipSmall";
import { DateTime } from "luxon";
import { Typography } from "@mui/material";

interface TimeChipProps {
  streamTime: DateTime;
  isLive: boolean;
  hideTime?: boolean;
}

export function TimeChip({ isLive, streamTime, hideTime }: TimeChipProps) {
  let timeDiff = "";
  if (!hideTime && streamTime.isValid) {
    timeDiff = isLive
      ? streamTime.toLocaleString(DateTime.TIME_WITH_SECONDS)
      : streamTime.toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS);
  }

  return (
    <ChipSmall
      sx={{
        "& .MuiChip-icon": {
          transform: "scale(0.7)",
          color: isLive ? "secondary.main" : grey[500],
          margin: 0,
        },
        "& .MuiChip-label": {
          padding: 0,
        },
      }}
      icon={<FiberManualRecordIcon />}
      style={{
        borderRadius: "4px",
        color: "#fff",
        background: "transparent",
        padding: "0 4px",
        letterSpacing: "0.05rem",
        display: "flex",
        minWidth: timeDiff.length > 0 ? "11.4rem" : "auto",
        justifyContent: "start",
      }}
      label={<Typography variant="body2">{timeDiff}</Typography>}
    />
  );
}
