import { DateTime } from "luxon";
import { createContext } from "react";
import { PLAYER_OPTIONS_LIVE, VideoPlayerOptions } from "utils/player_options";
import { TimeInterval } from "utils/time";

// Resync every this often
export const SYNC_FREQUENCY_MS = 500;
// Resync if the video is off by more than this amount
export const SYNC_MAX_DRIFT_ALLOWED_MS = 750;

export interface VideoSettings {
  playerOptions: VideoPlayerOptions;
  timeInterval: TimeInterval;
  isPlaying: boolean;
  playbackRate: number;
  syncTime: DateTime;
}

export const LIVE_VIDEO_SETTINGS: VideoSettings = {
  playerOptions: {
    htmlPlayerOptions: PLAYER_OPTIONS_LIVE,
    isLiveStream: true,
    hideTime: true,
  },
  timeInterval: {
    timeStart: DateTime.now(),
    timeEnd: DateTime.now(),
  },
  isPlaying: true,
  playbackRate: 1,
  syncTime: DateTime.now(),
};

export function getLiveVideoSettings() {
  return { ...LIVE_VIDEO_SETTINGS, syncTime: DateTime.now() };
}

export const VideoSettingsContext = createContext<VideoSettings>(
  getLiveVideoSettings()
);
