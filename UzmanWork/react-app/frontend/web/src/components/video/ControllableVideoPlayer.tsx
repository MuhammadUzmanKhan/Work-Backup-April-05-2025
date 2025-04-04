import { useEffect, useContext, useRef } from "react";
import {
  VideoPlayer,
  VideoPlayerHandle,
  VideoPlayerProps,
} from "./VideoPlayer";
import {
  SYNC_MAX_DRIFT_ALLOWED_MS,
  VideoSettingsContext,
} from "contexts/video_settings_context";

// A video player which can receive commands to play, pause, seek, etc.
export function ControllableVideoPlayer(props: VideoPlayerProps) {
  const playerRef = useRef<VideoPlayerHandle>(null);
  const videoSettings = useContext(VideoSettingsContext);

  // Update the video player based on controls
  // NOTE(@lberg): this is done only if we are not playing a live stream
  useEffect(() => {
    const player = playerRef.current?.player;
    const videoElement = player?.videoElement;
    if (!videoElement || !player) {
      return;
    }
    videoSettings.isPlaying ? videoElement.play() : videoElement.pause();
    // this applies to clips only
    if (
      !videoSettings.syncTime.isValid ||
      // TODO(@lberg): check if it's ok to have this here
      videoSettings.playerOptions.isLiveStream
    ) {
      return;
    }
    videoElement.playbackRate = videoSettings.playbackRate;
    // If we have drifted too much, we need to seek
    const syncTimeDiffMs = videoSettings.syncTime
      .diff(player.playingDate())
      .as("milliseconds");
    if (Math.abs(syncTimeDiffMs) > SYNC_MAX_DRIFT_ALLOWED_MS) {
      videoElement.currentTime += syncTimeDiffMs / 1000;
    }
  }, [
    videoSettings.syncTime,
    videoSettings.isPlaying,
    videoSettings.playbackRate,
    videoSettings.playerOptions.isLiveStream,
  ]);

  return <VideoPlayer ref={playerRef} {...props} />;
}
