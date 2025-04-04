import {
  forwardRef,
  MouseEvent,
  Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { Box, styled, type SxProps, useTheme } from "@mui/material";
import {
  useForceLiveTracking,
  useForcePlay,
  useForcePlayOnTouch,
  useRefetchStreamPeriodically,
  useThumbnailPoster,
  useTrackVideoTime,
  useVideoEndedCallback,
  useVideoPlayer,
} from "hooks/video_player";
import createPanZoom, { PanZoom } from "panzoom";
import { DEFAULT_POSTER_URL, VideoPlayerOptions } from "utils/player_options";
import { DisabledBox } from "./DisabledBox";
import { ErrorBox } from "./ErrorBox";
import { LoadingBox } from "./LoadingBox";
import { ElementSize, useElementSizeFromEl } from "hooks/element_size";
import {
  emitStreamAlert,
  PlayerInterface,
  useHandleMinimize,
} from "utils/video_player";
import { DateTime, Duration } from "luxon";
import { ControlsBar } from "./video_controls/custom_control_bar/ControlsBar";
import { Fade } from "components/Fade";
import { isNative, useIsMobile } from "components/layout/MobileOnly";
import {
  handleToggleHtmlElementFullScreenMode,
  shouldVideoFillWidth,
} from "./utils";
import { useAutoExitFullscreenOnPortrait } from "hooks/video_orientation";
import {
  VideoResRequestType,
  isDefined,
  onKinesisUrlSourceRemoveFn,
  OnStreamResponseFetchedFn,
  useKinesisStreamResponse,
  getResolutionFromSource,
  getTimezoneFromKinesisUrlSource,
  KinesisUrlSource,
} from "coram-common-utils";
import { VideoTopBar } from "./VideoTopBar";
import { isIOS } from "utils/isIOS";
import { PlaceHolderVideoPlayer } from "./PlaceHolderVideoPlayer";
import { VideoContainer, VideoPlayerContainer } from "./Containers";
import { togglePlayPauseVideo } from "./video_controls/custom_control_bar/utils";
import { VideoOverlayIcon } from "./VideoOverlayIcon";

const CONTROL_BAR_Z_INDEX = 2;
const CANVAS_Z_INDEX_BACKGROUND = 1;
export const CANVAS_Z_INDEX_FOREGROUND = 3;

const ControlBarContainer = styled(Box)({
  position: "absolute",
  bottom: "0",
  width: "100%",
  zIndex: CONTROL_BAR_Z_INDEX,
});

export interface VideoTimeState {
  videoCurrentTime: number;
  videoTotalTime: number;
}

export interface CanvasDrawProps {
  videoSize: ElementSize;
  moveToForeground: () => void;
  moveToBackground: () => void;
}

export interface VideoPlayerProps {
  videoName?: string;
  showBorder?: boolean;
  kinesisUrlSource: KinesisUrlSource;
  // Options for the player
  playerOptions: VideoPlayerOptions;
  // Whether audio is enabled
  isAudioEnabled?: boolean;
  isDrawingEnabled?: boolean;
  canvasDraw?: (props: CanvasDrawProps) => React.ReactNode;
  allowPanZoom?: boolean;
  onTimeChange?: (time: DateTime) => void;
  posterUrl?: string;
  onDownloadIconClick?: () => Promise<unknown>;
  onShareVideoIconClick?: VoidFunction;
  onNewTabIconClick?: (time: DateTime) => void;
  onHDIconClick?: (resolution: VideoResRequestType) => void;
  onArchiveIconClick?: VoidFunction;
  onVideoEnded?: VoidFunction;
  alwaysShowControls?: boolean;
  onToggleFullScreen?: (htmlElement: HTMLElement | null) => void;
  onClick?: (ev: MouseEvent) => void;
  onResponseFetched?: OnStreamResponseFetchedFn;
  onKinesisUrlSourceRemove?: onKinesisUrlSourceRemoveFn;
  videoPlayerContainerSx?: SxProps;
}

export interface VideoPlayerHandle {
  player?: PlayerInterface;
}

// This is the main video player component
// We forward a custom ref to access the player
export const VideoPlayer = forwardRef(function VideoPlayer(
  {
    videoName,
    showBorder = true,
    kinesisUrlSource,
    playerOptions,
    isAudioEnabled = false,
    isDrawingEnabled = false,
    canvasDraw = undefined,
    allowPanZoom = true,
    onTimeChange = undefined,
    onShareVideoIconClick = undefined,
    onDownloadIconClick = undefined,
    onNewTabIconClick = undefined,
    onVideoEnded = undefined,
    posterUrl = DEFAULT_POSTER_URL,
    onHDIconClick = undefined,
    onArchiveIconClick = undefined,
    alwaysShowControls = false,
    onToggleFullScreen = handleToggleHtmlElementFullScreenMode,
    onClick,
    onResponseFetched,
    onKinesisUrlSourceRemove,
    videoPlayerContainerSx,
  }: VideoPlayerProps,
  ref: Ref<VideoPlayerHandle>
) {
  const streamTimezone = getTimezoneFromKinesisUrlSource(kinesisUrlSource);
  // Mui theme
  const theme = useTheme();
  // If the video is playing too far behind live
  const [isOverLiveThrehsold, setIsOverLiveThrehsold] = useState(true);
  // If the video is playing enough behind the sync and we should resync
  const [isOverResyncThreshold, setIsOverResyncThreshold] = useState(true);

  // Current time of the stream
  const [streamTime, setStreamTime] = useState<DateTime>(
    DateTime.invalid("Not initialized")
  );
  // Reference to the polyDrawer container
  const containerRef = useRef<HTMLElement | null>(null);
  // Reference to the videoPlayer container
  const videoPlayerContainerRef = useRef<HTMLDivElement | null>(null);

  // To manage the video playback time
  const [videoTimeState, setVideoTimeState] = useState<VideoTimeState>({
    videoCurrentTime: 0,
    videoTotalTime: 0,
  });
  // Whether we are hovering over the video container
  const [isHover, setIsHover] = useState(false);

  // Whether the user recently has clicked on the video (used instead of hover effect on mobile)
  const [hasClicked, setHasClicked] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  const isMobile = useIsMobile();
  const [canvasZIndex, setCanvasZIndex] = useState(CANVAS_Z_INDEX_BACKGROUND);

  const moveCanvasToForeground = useCallback(() => {
    setCanvasZIndex(CANVAS_Z_INDEX_FOREGROUND);
  }, []);
  const moveCanvasToBackground = useCallback(() => {
    setCanvasZIndex(CANVAS_Z_INDEX_BACKGROUND);
  }, []);

  // The kinesis video url of the stream
  const {
    streamResponse,
    isError,
    isFetching,
    isOffline,
    isDisabled,
    refetchStreamUrl,
  } = useKinesisStreamResponse({
    kinesisUrlSource,
    isLiveStream: playerOptions.isLiveStream,
    onError: emitStreamAlert,
    onSuccess: onResponseFetched,
    onKinesisUrlSourceRemove,
  });

  // Refetch the stream url periodically to avoid permission issues
  // in kinesis streams.
  useRefetchStreamPeriodically(
    refetchStreamUrl,
    Duration.fromObject({ hours: 10 }),
    playerOptions.isLiveStream
  );

  const {
    Video,
    player,
    videoRef,
    videoState,
    hasStartedPlaying,
    srcLoaded,
    hasNativeHls,
  } = useVideoPlayer(
    videoName,
    playerOptions.htmlPlayerOptions,
    refetchStreamUrl,
    streamResponse,
    playerOptions.isLiveStream,
    playerOptions.initialSeekTime
  );
  useThumbnailPoster(videoRef, posterUrl);

  useImperativeHandle(
    ref,
    () => {
      if (player) {
        player.videoPlayerContainerRef = videoPlayerContainerRef.current;
      }
      return {
        player,
      };
    },
    [player]
  );

  useVideoEndedCallback(player, onVideoEnded);

  // Periodically update the time of the player
  // This is used to show the time and the live status on the video
  useTrackVideoTime(
    player,
    setIsOverLiveThrehsold,
    setIsOverResyncThreshold,
    setStreamTime,
    hasStartedPlaying,
    streamTimezone,
    onTimeChange
  );

  // Force the video to play on iOS in low power mode.
  useForcePlayOnTouch(
    player,
    srcLoaded,
    playerOptions.htmlPlayerOptions.autoplay && hasNativeHls
  );

  // Force the video to play on iOS.
  // This is used when exiting full screen
  useForcePlay(
    player,
    hasStartedPlaying,
    playerOptions.isLiveStream && hasNativeHls
  );

  // Periodically force to track live if we meet certain conditions
  useForceLiveTracking(
    player,
    videoState == "playing" &&
      isOverResyncThreshold &&
      playerOptions.isLiveStream
  );

  useAutoExitFullscreenOnPortrait(
    player?.videoElement,
    !!playerOptions.autoExitFullScreenOnPortrait
  );

  // This can detect if the video is stuck even if it has not
  // emitted any errors or warnings.
  // NOTE(@lberg): we use this on ios only
  useHandleMinimize(player, playerOptions.isLiveStream && isNative());

  // Setup panzoom object for the video and set the video ref
  useEffect(() => {
    // if not allowed to pan zoom then return
    if (!allowPanZoom) {
      return;
    }
    // NOTE(@lberg): we bind to the container to avoid conflicting with flex
    // This means we will be able to zoom and pan the borders too
    const node = containerRef.current;
    let panZoomInstance: PanZoom | undefined;

    function setupPanZoom() {
      if (hasStartedPlaying && node) {
        panZoomInstance = createPanZoom(node, {
          maxZoom: 15,
          minZoom: 1,
          // Disable going out of boundaries completely
          bounds: true,
          boundsPadding: 1,
          zoomDoubleClickSpeed: 1,
          // Panzoom binds to the parent and uses events capturing to prevent events from reaching children.
          // In our case we want some of the children to still receive events.
          onTouch: () => false,
        });
      }
    }

    setupPanZoom();
    return () => {
      if (panZoomInstance && node) {
        // NOTE(@lberg): this is because panzoom doesn't clean up after itself
        const style = node.style;
        style.transform = "";
        style.transformOrigin = "";
        node.setAttribute("style", style.cssText);
        panZoomInstance.dispose();
      }
    };
  }, [hasStartedPlaying, videoRef, allowPanZoom]);
  // Get the size of the video
  const { size: videoSize } = useElementSizeFromEl(videoRef.current);
  const { size: containerSize } = useElementSizeFromEl(containerRef.current);

  // Props for the top bar
  const videoTimeInfo = playerOptions.hideLiveIndicator
    ? undefined
    : {
        streamTime,
        isTrackingLive: !isOverLiveThrehsold,
        hideTime: playerOptions.hideTime,
      };

  if (playerOptions.isLiveStream && isDisabled) {
    return (
      <PlaceHolderVideoPlayer
        videoName={videoName}
        showBorder={showBorder}
        videoTimeInfo={videoTimeInfo}
        onClick={onClick}
      >
        <DisabledBox backgroundImage={posterUrl} />
      </PlaceHolderVideoPlayer>
    );
  }

  if (playerOptions.isLiveStream && isOffline) {
    return (
      <PlaceHolderVideoPlayer
        videoName={videoName}
        showBorder={showBorder}
        videoTimeInfo={videoTimeInfo}
        onClick={onClick}
      >
        <ErrorBox errorMsg={"Camera is offline"} backgroundImage={posterUrl} />
      </PlaceHolderVideoPlayer>
    );
  }

  if (isError) {
    return (
      <PlaceHolderVideoPlayer
        videoName={videoName}
        showBorder={showBorder}
        videoTimeInfo={videoTimeInfo}
        onClick={onClick}
      >
        <ErrorBox errorMsg={"Video not found"} backgroundImage={posterUrl} />
      </PlaceHolderVideoPlayer>
    );
  }

  // NOTE(@lberg): We can't early return as we need the video to mount
  const isLoading = isFetching || !hasStartedPlaying;

  const showControls = alwaysShowControls || (isMobile ? hasClicked : isHover);

  // NOTE(@lberg): we use the video intrinsic size here
  // and not the video display size, because we want them to stay consistent.
  const videoIsFullWidth = shouldVideoFillWidth(
    {
      width: player?.videoElement.videoWidth || 16,
      height: player?.videoElement.videoHeight || 9,
    },
    containerSize
  );
  const resolution = getResolutionFromSource(kinesisUrlSource);
  // on iOS we can't use absolute with percentages, so we has to selectively show.
  const showIosThumbnail = isLoading && hasNativeHls;

  function handleToggleFullScreen() {
    if (
      playerOptions.htmlPlayerOptions.videoControlOptions?.disableFullscreen ===
      true
    ) {
      return;
    }

    if (isIOS()) {
      // for iOS we always want to toggle native HTML5 video fullscreen mode. Anything else is not supported.
      const fullscreenElement = videoRef.current;
      handleToggleHtmlElementFullScreenMode(fullscreenElement);
    } else {
      const fullscreenElement = videoPlayerContainerRef.current;
      onToggleFullScreen(fullscreenElement);
    }
  }

  return (
    <VideoPlayerContainer
      onPointerDown={() => {
        if (!isMobile) {
          return;
        }
        // We introduce a small delay here before setting hasClicked to true. We use it to prevent
        // the next onPointerUp on Mobile devices to be immediately fired. We do this to have a consistent
        // behavior when the first click or touch shows ControlsBar and only the second click fires onClick.
        setTimeout(() => setHasClicked(true), 200);
        if (timer !== null) {
          clearTimeout(timer);
        }
        setTimer(setTimeout(() => setHasClicked(false), 5000));
      }}
      onPointerUp={(ev) => {
        // We must use onPointerUp here. "onClick" does not work on html5 video element.
        // On mobile devices we fire onClick only when the video was clicked or touched with
        // onPointerDown recently. When user touches the video, we may show ControlsBar for 5 seconds.
        const fireOnClik = isMobile ? hasClicked : true;
        if (fireOnClik) {
          onClick?.(ev);
        }
      }}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      border={showBorder ? "1px solid" : "none"}
      ref={videoPlayerContainerRef}
      sx={videoPlayerContainerSx}
    >
      <VideoTopBar videoTimeInfo={videoTimeInfo} videoName={videoName} />
      <VideoContainer bgcolor={theme.palette.common.black}>
        {isLoading && <LoadingBox sx={{ zIndex: 3 }} />}
        {/* Panzoom will bind to this container (this is mainly for siblings events handling) */}
        {/* Video container */}
        <Box
          height="100%"
          width="100%"
          display="flex"
          justifyContent="center"
          alignItems="center"
          fontSize={0}
          ref={containerRef}
          onClick={() => {
            if (player && !playerOptions.isLiveStream) {
              togglePlayPauseVideo(player.videoElement);
            }
          }}
        >
          <Video
            tabIndex={-1}
            style={{
              width: videoIsFullWidth ? "100%" : "auto",
              height: videoIsFullWidth ? "auto" : "100%",
              // NOTE(@lberg): This is a hack for safari
              // we need to render the video or it won't load
              // as such, we hide it behind the poster until the video is ready
              position: showIosThumbnail ? "absolute" : "static",
              zIndex: showIosThumbnail ? -1 : "auto",
            }}
            onTimeUpdate={() => {
              if (player) {
                setVideoTimeState({
                  videoCurrentTime: player.videoElement.currentTime,
                  videoTotalTime: player.videoElement.duration,
                });
              }
            }}
          />
          {/* We always mount this img as conditionally mounting it
            can cause the thumbnail to collapse as the img is waiting
            to download it.
             */}
          <img
            src={posterUrl}
            style={{
              width: "100%",
              display: showIosThumbnail ? "block" : "none",
            }}
          />
        </Box>

        {/* Canvas overlay with the video (and not the container) */}
        <Box
          width="100%"
          height="100%"
          left={0}
          top={0}
          position="absolute"
          display="flex"
          justifyContent="center"
          alignItems="center"
          zIndex={canvasZIndex}
          sx={{
            pointerEvents: "none",
          }}
        >
          <Box width={videoSize.width} height={videoSize.height}>
            {canvasDraw &&
              canvasDraw({
                videoSize,
                moveToForeground: moveCanvasToForeground,
                moveToBackground: moveCanvasToBackground,
              })}
          </Box>
        </Box>
        {/* play/pause toggle overlay with the video (and not the container) */}
        <Box
          width="100%"
          height="100%"
          left={0}
          top={0}
          position="absolute"
          display="flex"
          justifyContent="center"
          alignItems="center"
          zIndex={canvasZIndex}
          sx={{
            pointerEvents: "none",
          }}
        >
          {!playerOptions.isLiveStream && (
            <VideoOverlayIcon
              videoState={videoState}
              videoElementSize={videoSize}
            />
          )}
        </Box>
        {/* Player bottom control bar */}
        {isDefined(playerOptions.htmlPlayerOptions.videoControlOptions) && (
          <ControlBarContainer
            sx={{
              ...(isDrawingEnabled && { pointerEvents: "none" }),
            }}
          >
            <Fade in={showControls}>
              <ControlsBar
                isLiveStream={playerOptions.isLiveStream}
                isVisible={showControls}
                streamTime={streamTime}
                player={player}
                videoControlOptions={
                  playerOptions.htmlPlayerOptions.videoControlOptions
                }
                videoTimeState={videoTimeState}
                isAudioEnabled={isAudioEnabled}
                videoPlayerContainerRef={videoPlayerContainerRef}
                onShareVideoIconClick={onShareVideoIconClick}
                onDownloadIconClick={onDownloadIconClick}
                onNewTabIconClick={onNewTabIconClick}
                onToggleFullScreen={handleToggleFullScreen}
                currentResolution={resolution}
                onHDIconClick={onHDIconClick}
                onArchiveIconClick={onArchiveIconClick}
              />
            </Fade>
          </ControlBarContainer>
        )}
      </VideoContainer>
    </VideoPlayerContainer>
  );
});
