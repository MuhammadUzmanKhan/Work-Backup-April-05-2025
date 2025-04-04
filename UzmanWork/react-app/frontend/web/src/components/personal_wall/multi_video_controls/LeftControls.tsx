import {
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  AccessTime as AccessTimeIcon,
} from "@mui/icons-material";
import { Box } from "@mui/material";
import { grey } from "@mui/material/colors";
import { Stack } from "@mui/system";
import { ActionButton } from "components/styled_components/ActionButton";
import { TimelineControls } from "components/timeline/TimelineControls";
import { VideoSpeedControl } from "components/video/video_controls/VideoSpeedControl";
import { Forward10Icon } from "icons/player/forward-10-icon";
import { Replay10Icon } from "icons/player/replay-10-icon";
import { DateTime } from "luxon";

interface LeftControlsProps extends React.ComponentProps<typeof Stack> {
  videoTime: DateTime;
  timezone: string;
  isPlaying: boolean;
  isLive: boolean;
  playbackRate: number;
  onPlayClick: VoidFunction;
  onPauseClick: VoidFunction;
  onSeekControlClick: (seek: number) => void;
  onPlaybackRateControlClick: (speed: number) => void;
  onTimeChange: (time: DateTime) => void;
}

export function LeftControls({
  videoTime,
  timezone,
  isPlaying,
  isLive,
  playbackRate,
  onPlayClick,
  onPauseClick,
  onSeekControlClick,
  onPlaybackRateControlClick,
  onTimeChange,
  ...stackProps
}: LeftControlsProps) {
  return (
    <Stack direction="column" gap={1} {...stackProps}>
      <Stack
        direction="row"
        gap={3}
        alignItems="center"
        justifyContent="space-between"
      >
        <ActionButton
          onClick={isPlaying ? onPauseClick : onPlayClick}
          disabled={isLive}
        >
          {isPlaying ? (
            <PauseIcon fontSize="large" onClick={onPauseClick} />
          ) : (
            <PlayArrowIcon fontSize="large" onClick={onPlayClick} />
          )}
        </ActionButton>

        <Stack direction="row" gap={1} alignItems="center">
          <ActionButton
            onClick={() => onSeekControlClick(-10)}
            disabled={isLive}
          >
            <Replay10Icon
              fontSize="large"
              onClick={() => onSeekControlClick(-10)}
            />
          </ActionButton>
          <ActionButton
            onClick={() => onSeekControlClick(10)}
            disabled={isLive}
          >
            <Forward10Icon
              fontSize="large"
              onClick={() => onSeekControlClick(10)}
            />
          </ActionButton>
        </Stack>
        <VideoSpeedControl
          playbackRate={playbackRate}
          onPlayBackRateClick={(speed) => onPlaybackRateControlClick(speed)}
          isActive={!isLive}
          variant="large"
          color={isLive ? grey[300] : "auto"}
          tooltip={undefined}
        />
      </Stack>
      <TimelineControls
        videoTime={videoTime}
        timezone={timezone}
        onTimeChange={(time) => onTimeChange(time)}
        preDateElement={
          <AccessTimeIcon
            fontSize="small"
            sx={{ mr: "4px", color: "neutral.500" }}
          />
        }
        postDateElement={<Box mr="4px">,</Box>}
      />
    </Stack>
  );
}
