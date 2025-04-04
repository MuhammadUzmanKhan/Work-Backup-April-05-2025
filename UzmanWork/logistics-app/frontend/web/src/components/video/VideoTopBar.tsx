import { Stack } from "@mui/material";
import { TimeChip } from "./TimeChip";
import { DateTime } from "luxon";
import { isDefined } from "coram-common-utils";
import { grey } from "@mui/material/colors";
import { ChipSmall } from "./ChipSmall";

export interface VideoTimeInfo {
  streamTime: DateTime;
  isTrackingLive: boolean;
  hideTime?: boolean;
}

interface VideoTopBarProps {
  videoTimeInfo?: VideoTimeInfo;
  videoName?: string;
}

export function VideoTopBar({ videoTimeInfo, videoName }: VideoTopBarProps) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      sx={{
        backgroundColor: grey[800],
      }}
      py="0.2rem"
      px="0.5rem"
    >
      {isDefined(videoTimeInfo) ? (
        <TimeChip
          isLive={videoTimeInfo.isTrackingLive}
          streamTime={videoTimeInfo.streamTime}
          hideTime={videoTimeInfo.hideTime}
        />
      ) : (
        <span></span>
      )}
      {videoName && (
        <ChipSmall
          style={{
            color: "white",
            background: "transparent",
            padding: "0 1px",
            letterSpacing: "0.05rem",
            borderRadius: "4px",
            // Fixed width to allow 'ellipsis' for overflow. However, long text div dynamically adjusts available space based on the flex-grow property for different screen sizes
            width: "0px",
            flex: "1",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            justifyContent: "flex-end",
          }}
          label={videoName}
        />
      )}
    </Stack>
  );
}
