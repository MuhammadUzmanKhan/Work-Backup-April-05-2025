import Stack from "@mui/material/Stack";
import { VideoControlsOptions } from "utils/player_options";
import { VideoSpeedControl } from "../VideoSpeedControl";
import {
  VideoFullScreenControlButton,
  VideoFullScreenControlButtonDisabled,
} from "../VideoFullScreenControlIconButton";
import { DateTime } from "luxon";
import { NewTabIcon } from "icons/new-tab";
import { useState } from "react";
import { CircularProgress, Tooltip } from "@mui/material";
import {
  VideoAudioControlButton,
  VideoAudioControlButtonDisabled,
} from "../VideoAudioControlIconButton";
import { DownloadIcon2 } from "icons/timeline-player/DownloadIcon2";
import { ArchiveIcon2 } from "icons/archive-icon2";
import { ShareIcon } from "icons/share-icon";
import { isDefined, MountIf, VideoResRequestType } from "coram-common-utils";
import { HDControlIconButton } from "./HDControlIconButton";
import { ActionButton } from "components/styled_components/ActionButton";

interface RightVideoControlsProps {
  isLiveStream: boolean;
  videoElement: HTMLVideoElement | undefined;
  videoPlayerContainer: HTMLDivElement | null;
  videoControlOptions: VideoControlsOptions;
  isAudioEnabled: boolean;
  currentTime: DateTime;
  currentResolution: VideoResRequestType;
  onShare?: VoidFunction;
  onDownload?: () => Promise<unknown>;
  onArchive?: VoidFunction;
  onNewTab?: (time: DateTime) => void;
  onToggleFullScreen?: VoidFunction;
  onHDIconClick?: (resolution: VideoResRequestType) => void;
}

export function RightVideoControls({
  videoElement: player,
  videoPlayerContainer,
  videoControlOptions,
  isAudioEnabled,
  currentTime,
  currentResolution,
  isLiveStream,
  onDownload = undefined,
  onShare = undefined,
  onArchive = undefined,
  onNewTab = undefined,
  onToggleFullScreen = undefined,
  onHDIconClick = undefined,
}: RightVideoControlsProps) {
  const [isDownloadInProgress, setIsDownloadInProgress] = useState(false);

  async function handleDownload() {
    if (!onDownload) {
      return;
    }

    try {
      if (document.fullscreenElement === videoPlayerContainer) {
        document.exitFullscreen();
      }
      setIsDownloadInProgress(true);
      await onDownload();
    } finally {
      setIsDownloadInProgress(false);
    }
  }

  async function handleShare() {
    if (!onShare) {
      return;
    }

    if (document.fullscreenElement === videoPlayerContainer) {
      document.exitFullscreen();
    }
    onShare();
  }

  async function handleArchive() {
    if (!onArchive) {
      return;
    }

    if (document.fullscreenElement === videoPlayerContainer) {
      document.exitFullscreen();
    }
    onArchive();
  }

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="flex-end"
      sx={{
        flexGrow: 1,
        gap: "0.65rem",
        maxHeight: "1.25rem",
      }}
    >
      <MountIf condition={isDefined(onDownload)}>
        {isDownloadInProgress ? (
          <Tooltip title="Downloading" placement="bottom">
            <Stack>
              <CircularProgress size={20} color="inherit" />
            </Stack>
          </Tooltip>
        ) : (
          <Tooltip title="Click to Download" placement="bottom">
            <ActionButton aria-label="Download Video" onClick={handleDownload}>
              <DownloadIcon2 />
            </ActionButton>
          </Tooltip>
        )}
      </MountIf>

      <MountIf condition={isDefined(onArchive)}>
        <Tooltip title="Click to Archive" placement="bottom">
          <ActionButton aria-label="Archive Icon" onClick={handleArchive}>
            <ArchiveIcon2 />
          </ActionButton>
        </Tooltip>
      </MountIf>

      <MountIf condition={isDefined(onShare)}>
        <Tooltip title="Click to Share" placement="bottom">
          <ActionButton aria-label="Share Video" onClick={handleShare}>
            <ShareIcon />
          </ActionButton>
        </Tooltip>
      </MountIf>

      <MountIf condition={isAudioEnabled}>
        {isDefined(player) ? (
          <VideoAudioControlButton video={player} />
        ) : (
          <VideoAudioControlButtonDisabled />
        )}
      </MountIf>

      {onNewTab && (
        <Tooltip title="Click to open in a new tab" placement="bottom">
          <ActionButton
            aria-label="New Tab Icon"
            onClick={() => onNewTab(currentTime)}
          >
            <NewTabIcon />
          </ActionButton>
        </Tooltip>
      )}

      {!videoControlOptions.disableFastForward && (
        <VideoSpeedControl
          playbackRate={player?.playbackRate}
          onPlayBackRateClick={(speed: number) => {
            if (player) player.playbackRate = speed;
          }}
          isFullScreen={document.fullscreenElement === videoPlayerContainer}
          tooltip="Playback Speed"
          variant="small"
        />
      )}

      {isLiveStream && isDefined(onHDIconClick) && (
        <HDControlIconButton
          onClick={onHDIconClick}
          resolution={currentResolution}
        />
      )}

      <MountIf condition={!videoControlOptions.disableFullscreen}>
        {isDefined(player) && isDefined(onToggleFullScreen) ? (
          <VideoFullScreenControlButton
            video={player}
            onClick={onToggleFullScreen}
          />
        ) : (
          <VideoFullScreenControlButtonDisabled />
        )}
      </MountIf>
    </Stack>
  );
}
