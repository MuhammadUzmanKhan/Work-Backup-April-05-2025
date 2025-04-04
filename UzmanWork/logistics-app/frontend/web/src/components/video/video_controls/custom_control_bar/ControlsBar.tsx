import { Stack } from "@mui/material";
import { VideoControlsOptions } from "utils/player_options";
import { VideoTimeState } from "components/video/VideoPlayer";
import {
  canForward,
  canRewind,
  forwardVideo,
  getVideoState,
  rewindVideo,
} from "./utils";
import { VideoControlIcon } from "./VideoControlIcon";
import { VideoProgressBar } from "./VideoProgressBar";
import { LeftVideoControls } from "./LeftVideoControls";
import { DateTime } from "luxon";
import { PlayerInterface } from "utils/video_player";
import { preventEventBubbling } from "utils/dom_event_handling";
import { RightVideoControls } from "./RightVideoControls";
import { VideoResRequestType, isDefined } from "coram-common-utils";
import {
  useIsLimitedUser,
  useIsRegularUser,
} from "components/layout/RoleGuards";
import { PlayIcon } from "icons/play-icon";
import { ActionButton } from "components/styled_components/ActionButton";

interface CustomControlsBarProps {
  isLiveStream: boolean;
  isVisible: boolean;
  streamTime: DateTime;
  player: PlayerInterface | undefined;
  videoPlayerContainerRef: React.RefObject<HTMLDivElement>;
  videoControlOptions: VideoControlsOptions;
  videoTimeState: VideoTimeState;
  isAudioEnabled: boolean;
  currentResolution: VideoResRequestType;
  onDownloadIconClick?: () => Promise<unknown>;
  onShareVideoIconClick?: VoidFunction;
  onNewTabIconClick?: (time: DateTime) => void;
  onToggleFullScreen?: VoidFunction;
  onArchiveIconClick?: VoidFunction;
  onHDIconClick?: (resolution: VideoResRequestType) => void;
}

export function ControlsBar({
  isLiveStream,
  isVisible,
  streamTime,
  player,
  videoControlOptions,
  videoPlayerContainerRef,
  videoTimeState,
  isAudioEnabled,
  currentResolution,
  onDownloadIconClick = undefined,
  onShareVideoIconClick = undefined,
  onNewTabIconClick = undefined,
  onToggleFullScreen = undefined,
  onHDIconClick = undefined,
  onArchiveIconClick = undefined,
}: CustomControlsBarProps) {
  const canRewindStreamTime = canRewind(player?.videoElement);
  const canForwardStreamTime = canForward(player?.videoElement);
  const videoState = getVideoState(player?.videoElement);

  const isLimitedUser = useIsLimitedUser();
  const isRegularUser = useIsRegularUser();

  const videoControlIcon = isDefined(player) ? (
    <VideoControlIcon
      videoState={videoState}
      videoElement={player.videoElement}
    />
  ) : (
    <ActionButton disabled>
      <PlayIcon />
    </ActionButton>
  );

  return (
    <Stack
      justifyContent="center"
      alignItems="space-between"
      color="white"
      onPointerUp={(ev) => (isVisible ? preventEventBubbling(ev) : null)}
      sx={{
        maxHeight: "3rem",
        backgroundColor: "#3c3e49bd",
        gap: "0.5rem",
        px: "0.75rem",
        py: "0.62rem",
      }}
    >
      {!isLiveStream && player && (
        <VideoProgressBar
          videoRef={player.videoElement}
          boxSx={{
            cursor: "pointer",
            minWidth: "100%",
          }}
        />
      )}

      <Stack
        direction="row"
        justifyContent="space-between"
        sx={{ alignSelf: "stretch", px: "3px" }}
      >
        {!isLiveStream && (
          <LeftVideoControls
            videoControlIcon={videoControlIcon}
            canRewindStreamTime={canRewindStreamTime}
            canForwardStreamTime={canForwardStreamTime}
            currentTime={videoTimeState.videoCurrentTime}
            totalTime={videoTimeState.videoTotalTime}
            onRewind={() => {
              if (!isDefined(player)) return;
              rewindVideo(player.videoElement);
            }}
            onForward={() => {
              if (!isDefined(player)) return;
              forwardVideo(player.videoElement);
            }}
          />
        )}
        <RightVideoControls
          isLiveStream={isLiveStream}
          currentTime={streamTime}
          videoElement={player?.videoElement}
          videoPlayerContainer={videoPlayerContainerRef.current}
          videoControlOptions={videoControlOptions}
          isAudioEnabled={isAudioEnabled}
          currentResolution={currentResolution}
          onDownload={isRegularUser ? onDownloadIconClick : undefined}
          onShare={isRegularUser ? onShareVideoIconClick : undefined}
          onNewTab={onNewTabIconClick}
          onToggleFullScreen={onToggleFullScreen}
          onHDIconClick={onHDIconClick}
          onArchive={isLimitedUser ? onArchiveIconClick : undefined}
        />
      </Stack>
    </Stack>
  );
}
