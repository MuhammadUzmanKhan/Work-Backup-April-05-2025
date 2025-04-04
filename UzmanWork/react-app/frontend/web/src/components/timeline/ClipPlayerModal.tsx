import { Dispatch, SetStateAction, useMemo } from "react";
import { Modal, DialogContent, Paper } from "@mui/material";
import { AbsolutelyCentered } from "components/AbsolutelyCentered";
import {
  CameraResponse,
  KinesisVideoClipRequest,
  getPlayerCamera,
} from "coram-common-utils";
import {
  PLAYER_OPTIONS_SCRUB_BAR,
  VideoPlayerOptions,
} from "utils/player_options";
import { FixedSizeVideoPlayer } from "components/video/FixedSizeVideoPlayer";
import { DateTime } from "luxon";

interface ClipPlayerModalProps {
  videoName: string;
  open: boolean;
  onClose: Dispatch<SetStateAction<boolean>>;
  kinesisOption: KinesisVideoClipRequest;
  currentStream: CameraResponse;
  onVideoEnded?: VoidFunction;
  onDownloadClick: () => Promise<unknown>;
  onShareVideoClick: VoidFunction;
  onArchiveClick: VoidFunction;
}

const PLAYER_OPTIONS: VideoPlayerOptions = {
  htmlPlayerOptions: PLAYER_OPTIONS_SCRUB_BAR,
  isLiveStream: false,
  hideTime: false,
};

export function ClipPlayerModal({
  videoName,
  open,
  onClose,
  kinesisOption,
  currentStream,
  onVideoEnded,
  onDownloadClick,
  onShareVideoClick,
  onArchiveClick,
}: ClipPlayerModalProps) {
  const kinesisUrlSource = useMemo(
    () => ({
      camera: getPlayerCamera(currentStream),
      kinesisOptions: kinesisOption,
    }),
    [currentStream, kinesisOption]
  );
  return (
    <Modal open={open} onClose={onClose}>
      <DialogContent sx={{ p: 0 }}>
        <AbsolutelyCentered>
          <Paper elevation={12} sx={{ p: 3 }}>
            <FixedSizeVideoPlayer
              videoName={videoName}
              kinesisUrlSource={kinesisUrlSource}
              playerOptions={PLAYER_OPTIONS}
              allowPanZoom={true}
              onNewTabIconClick={() => {
                const startTime = DateTime.fromISO(
                  kinesisUrlSource.kinesisOptions.start_time
                );
                const endTime = DateTime.fromISO(
                  kinesisUrlSource.kinesisOptions.end_time
                );
                const timelineUrl = `/timeline/${
                  currentStream.camera.id
                }?ts=${startTime.toMillis()}&te=${endTime.toMillis()}`;
                window.open(`${timelineUrl}`, "_blank");
              }}
              onShareVideoIconClick={onShareVideoClick}
              onDownloadIconClick={onDownloadClick}
              onArchiveIconClick={onArchiveClick}
              onVideoEnded={onVideoEnded}
              isAudioEnabled={currentStream.camera.is_audio_enabled}
            />
          </Paper>
        </AbsolutelyCentered>
      </DialogContent>
    </Modal>
  );
}
