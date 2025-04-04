export interface VideoControlsOptions {
  disableFastForward?: boolean;
  disableFullscreen?: boolean;
}

export interface HTMLPlayerOptions {
  autoplay: boolean;
  muted: boolean;
  videoControlOptions?: VideoControlsOptions;
}

// Static resource for the poster image
export const DEFAULT_POSTER_URL =
  "/static/800x600-black-solid-color-background.png";

export const PLAYER_OPTIONS_NO_INTERACTIONS: HTMLPlayerOptions = {
  autoplay: true,
  muted: true,
};

export const PLAYER_OPTIONS_LIVE: HTMLPlayerOptions = {
  autoplay: true,
  muted: true,
  videoControlOptions: { disableFastForward: true },
};

export const PLAYER_OPTIONS_SCRUB_BAR: HTMLPlayerOptions = {
  autoplay: true,
  muted: true,
  videoControlOptions: {},
};

interface VideoPlayerCustomOptions {
  hideStreamName?: boolean;
  // Whether this player is for a live stream
  isLiveStream: boolean;
  // Whether to hide the live indicator in live mode
  hideLiveIndicator?: boolean;
  // Whether to hide the time stamp
  hideTime?: boolean;
  // Seek to this value when the player is first loaded
  // NOTE(@lberg): this is slightly hacky and it might be better to force
  // a sync time as we do in the personal wall page.
  initialSeekTime?: number;
  // Whether to exit full screen when the player is in portrait mode
  autoExitFullScreenOnPortrait?: boolean;
}

export interface VideoPlayerOptions extends VideoPlayerCustomOptions {
  htmlPlayerOptions: HTMLPlayerOptions;
}

export const CLIP_DURATION_MINUTES = 3;

export const JOURNEY_DURATION_MINUTES = "10";
