import { Stack, Typography } from "@mui/material";
import { Replay10Icon } from "icons/timeline-player/Replay10Icon";
import { Forward10Icon } from "icons/timeline-player/Forward10Icon";
import { formatTime } from "./utils";
import { ActionButton } from "components/styled_components/ActionButton";

interface LeftVideoControlsProps {
  videoControlIcon: JSX.Element | null;
  canRewindStreamTime: boolean;
  canForwardStreamTime: boolean;
  currentTime: number;
  totalTime: number;
  onRewind: () => void;
  onForward: () => void;
}

export function LeftVideoControls({
  videoControlIcon,
  canRewindStreamTime,
  canForwardStreamTime,
  currentTime,
  totalTime,
  onRewind,
  onForward,
}: LeftVideoControlsProps) {
  return (
    <Stack direction="row" gap="0.75rem" alignItems="center">
      {videoControlIcon}
      <ActionButton onClick={onRewind} disabled={!canRewindStreamTime}>
        <Replay10Icon color={canRewindStreamTime ? "#ffff" : "#adadad"} />
      </ActionButton>
      <ActionButton onClick={onForward} disabled={!canForwardStreamTime}>
        <Forward10Icon color={canForwardStreamTime ? "#ffff" : "#adadad"} />
      </ActionButton>
      <Typography variant="body1" sx={{ userSelect: "none" }}>
        {formatTime(currentTime)} / {formatTime(totalTime)}
      </Typography>
    </Stack>
  );
}
