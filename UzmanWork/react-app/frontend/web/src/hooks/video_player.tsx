import {
  isDefined,
  isHlsStreamResponse,
  StreamResponse,
} from "coram-common-utils";
import Hls from "hls.js";
import {
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DEFAULT_POSTER_URL, HTMLPlayerOptions } from "utils/player_options";
import { DateTime, Duration } from "luxon";
import {
  getVideoState,
  VideoState,
} from "components/video/video_controls/custom_control_bar/utils";
import {
  initializeHlsPlayer,
  initializeWebRtcPlayer,
  PlayerInterface,
} from "utils/video_player";

// Max time to declare a stream as non live
const LIVE_THRESHOLD_S = 15;
// Max time to force a resync for the live stream
const LIVE_THRESHOLD_TO_RESYNC_S = 5;
// How often we force the stream to track the edge
const TRACK_EDGE_FREQUENCY_MS = 2000;
// How often we force the video to play.
const FORCE_LIVE_INTERVAL_MS = 500;

// TODO(@lberg): on ios the video is a native webkitJS
// which has a method to get the time
// https://developer.apple.com/documentation/webkitjs/htmlmediaelement/1634352-getstartdate
// However, I could not find a type for it
export interface HTMLMediaElementIOS extends HTMLMediaElement {
  getStartDate: () => Date;
  webkitEnterFullscreen?: () => void;
  webkitExitFullscreen?: () => void;
}

// Track the video time and update it. Also, do the same for the live status
export function useTrackVideoTime(
  player: PlayerInterface | undefined,
  setIsOverLiveThrehsold: React.Dispatch<SetStateAction<boolean>>,
  setIsOverResyncThreshold: React.Dispatch<SetStateAction<boolean>>,
  setStreamTime: React.Dispatch<DateTime>,
  hasStartedPlaying: boolean,
  timezone: string,
  onTimeChange?: (time: DateTime) => void
) {
  // Keep a ref to not re-render the component
  const onTimeChangeRef = useRef(onTimeChange);
  onTimeChangeRef.current = onTimeChange;

  const setTimeAndLive = useCallback(
    (fragmentTime: DateTime | null) => {
      const newTime =
        fragmentTime === null
          ? DateTime.invalid("No fragment time")
          : fragmentTime.setZone(timezone);
      setStreamTime(newTime);
      if (onTimeChangeRef.current) {
        onTimeChangeRef.current(newTime);
      }
      if (!newTime.isValid) {
        return;
      }
      const timeDiffS = DateTime.now()
        .setZone(timezone)
        .diff(newTime)
        .as("seconds");
      setIsOverLiveThrehsold(timeDiffS > LIVE_THRESHOLD_S);
      setIsOverResyncThreshold(timeDiffS > LIVE_THRESHOLD_TO_RESYNC_S);
    },
    [setStreamTime, setIsOverLiveThrehsold, setIsOverResyncThreshold, timezone]
  );

  useEffect(() => {
    if (!hasStartedPlaying || player === undefined) {
      setTimeAndLive(null);
      return;
    }
    // Set a timer to update the current time.
    const interval = setInterval(() => {
      setTimeAndLive(player.playingDate());
    }, 250);
    return () => {
      clearInterval(interval);
    };
  }, [player, hasStartedPlaying, setTimeAndLive]);
}

// Force the video to play on touch. This can be used to force the video to play
// if autoplay does not kick in (e.g. because of battery saving mode)
export function useForcePlayOnTouch(
  player: PlayerInterface | undefined,
  ready: boolean,
  enabled: boolean
) {
  useEffect(() => {
    if (!ready || !enabled || player === undefined) {
      return;
    }
    const pointerFn = () => {
      if (player.videoElement.paused) {
        player.videoElement.play();
      }
    };
    document.addEventListener("pointerdown", pointerFn);
    return () => document.removeEventListener("pointerdown", pointerFn);
  }, [player, ready, enabled]);
}

// Force the video to play if it is paused.
export function useForcePlay(
  player: PlayerInterface | undefined,
  ready: boolean,
  enabled: boolean
) {
  useEffect(() => {
    if (!ready || !enabled || !isDefined(player)) {
      return;
    }
    const pointerFn = () => {
      if (player.videoElement.paused) {
        player.videoElement.play();
      }
    };
    const interval = setInterval(pointerFn, FORCE_LIVE_INTERVAL_MS);
    return () => interval && clearInterval(interval);
  }, [player, ready, enabled]);
}

// Optionally (based on enabled) force to track the live video
// If the player has fallen behind (e.g. because the tab was minimized)
// We will force it to skip segments until it syncs with live again
export function useForceLiveTracking(
  player: PlayerInterface | undefined,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled || player === undefined) {
      return;
    }
    const syncInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        player.syncLive();
      }
    }, TRACK_EDGE_FREQUENCY_MS);

    return () => clearInterval(syncInterval);
  }, [player, enabled]);
}

function useHasNativeHLS() {
  return useMemo(() => !Hls.isSupported(), []);
}

export function useVideoPlayer(
  videoName: string | undefined,
  htmlPlayerOptions: HTMLPlayerOptions,
  refetchStreamUrl: () => Promise<void>,
  streamResponse: StreamResponse | undefined,
  isLiveStream: boolean,
  initialSeekTime?: number
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Player interface
  const [player, setPlayer] = useState<PlayerInterface | undefined>();
  // Whether we have set the src on the video element
  const [srcLoaded, setSrcLoaded] = useState(false);
  const [videoState, setVideoState] = useState<
    "loading" | "playing" | "paused"
  >("loading");
  // Whether hls.js can be used (everywhere except ios)
  const hasNativeHls = useHasNativeHLS();

  // This can be used as a tag in a react component to render the video
  const Video = useCallback(
    ({ ...props }) => {
      const { style, ...rest } = props;
      return (
        <video
          poster={DEFAULT_POSTER_URL}
          muted={htmlPlayerOptions.muted}
          controls={false}
          autoPlay={htmlPlayerOptions.autoplay}
          playsInline={true}
          ref={videoRef}
          {...rest}
          style={{
            ...style,
            maxWidth: "100%",
            maxHeight: "100%",
            outline: "none",
          }}
        ></video>
      );
    },
    [htmlPlayerOptions.muted, htmlPlayerOptions.autoplay]
  );

  useEffect(() => {
    if (!isDefined(streamResponse)) {
      return;
    }
    const video = videoRef.current;
    if (!isDefined(video)) {
      return;
    }

    let videoPlayer: PlayerInterface | undefined = undefined;
    const playerCallbacks = {
      onSourceLoaded: () => setSrcLoaded(true),
      onVideoStartedPlay: () => setVideoState("playing"),
      onVideoPaused: () => setVideoState("paused"),
      onVideoReload: () => setVideoState("loading"),
    };

    if (isHlsStreamResponse(streamResponse)) {
      videoPlayer = initializeHlsPlayer(
        video,
        hasNativeHls,
        isLiveStream,
        streamResponse.data.video_url,
        videoName,
        playerCallbacks,
        initialSeekTime
      );
    } else {
      videoPlayer = initializeWebRtcPlayer(
        video,
        streamResponse.data,
        streamResponse.sign_token,
        videoName,
        refetchStreamUrl,
        playerCallbacks
      );
    }
    setPlayer(videoPlayer);

    return () => {
      setSrcLoaded(false);
      setVideoState("loading");
      videoPlayer?.cleanup();
      setPlayer(undefined);
    };
  }, [
    setPlayer,
    videoName,
    streamResponse,
    setSrcLoaded,
    setVideoState,
    isLiveStream,
    hasNativeHls,
    initialSeekTime,
    refetchStreamUrl,
  ]);

  const hasStartedPlaying = videoState === "playing" || videoState === "paused";
  return {
    Video,
    player,
    videoRef,
    videoState,
    hasStartedPlaying,
    srcLoaded,
    hasNativeHls: hasNativeHls,
  };
}

export function useThumbnailPoster(
  videoRef: React.RefObject<HTMLVideoElement>,
  posterUrl?: string
) {
  // NOTE(@lberg): we can't really depend on the videoRef as it's a ref.
  // Still, the ref should at least exist when this effect runs the first time.
  // We could also use an interval.
  useEffect(() => {
    if (posterUrl && videoRef.current) {
      videoRef.current.poster = posterUrl;
    }
  }, [posterUrl, videoRef]);
}

export function useVideoEndedCallback(
  player: PlayerInterface | undefined,
  onVideoEnded: (() => void) | undefined
) {
  const callbackRef = useRef<() => void>();
  callbackRef.current = onVideoEnded;

  useEffect(() => {
    const checkVideoState = () => {
      if (player?.videoElement && callbackRef.current) {
        const videoState = getVideoState(player.videoElement);
        if (videoState === VideoState.Ended) {
          callbackRef.current();
        }
      }
    };
    // Check video state periodically
    const interval = setInterval(checkVideoState, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [player]);
}

export function useRefetchStreamPeriodically(
  refetchStreamUrl: () => Promise<void>,
  frequency: Duration,
  enabled: boolean
) {
  const frequencyMs = frequency.as("milliseconds");
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const interval = setInterval(() => {
      refetchStreamUrl();
    }, frequencyMs);
    return () => clearInterval(interval);
  }, [enabled, refetchStreamUrl, frequencyMs]);
}
