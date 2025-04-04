import { Box } from "@mui/material";
import {
  CameraResponse,
  VideoResRequestType,
  HIGH_RESOLUTION_CONFIG,
  LOW_RESOLUTION_CONFIG,
  useStoreLiveStreamResponses,
  useKeepLiveVideosAlive,
  useMostRecentThumbnailsEnlarged,
} from "coram-common-utils";
import {
  ForwardedRef,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { VideoPlayerOptions } from "utils/player_options";
import { FullScreenProvider, FullScreenVideoPlayer } from "components/common";
import { FullScreenExitButton } from "./FullScreenExitButton";
import { useIsFullScreen } from "hooks/full_screen";
import { VideoPlayer } from "./video/VideoPlayer";

// TODO(@lberg): refactor this to:
// - apply pagination outside of this component
// - apply keep alive outside of this component
interface VideoGridProps {
  defaultVideoName?: string;
  cameraResponses: CameraResponse[];
  page: number;
  videoPerRow?: number;
  rowsPerPage?: number;
  playerOptions: VideoPlayerOptions;
  preferWebrtc: boolean;
  width: string;
}

// TODO(@lberg): remove this, currently we can't support
const DISABLE_SWITCH_TO_HD = true;

export const VideoGrid = forwardRef(function VideoGrid(
  {
    defaultVideoName,
    page,
    cameraResponses: cameraResponses,
    videoPerRow = 3,
    rowsPerPage = 3,
    playerOptions,
    preferWebrtc,
    width,
  }: VideoGridProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  // Expose the ref outside but keep it as a RefObject here
  const ref = useRef<HTMLInputElement>(null);
  useImperativeHandle(forwardedRef, () => ref.current as HTMLInputElement);

  const navigate = useNavigate();

  const isAnythingFullscreen = useIsFullScreen();

  const isAllVideosFullScreenModeActive =
    isAnythingFullscreen && document.fullscreenElement === ref.current;

  const pageCameraResponses = useMemo(
    () =>
      Array.from(
        [...cameraResponses].sort((cam1, cam2) =>
          cam1.camera.name.localeCompare(cam2.camera.name)
        )
      ).slice(
        page * videoPerRow * rowsPerPage,
        (page + 1) * videoPerRow * rowsPerPage
      ),
    [cameraResponses, page, videoPerRow, rowsPerPage]
  );

  const [hdCameraIds, setHdCameraIds] = useState<Set<number>>(new Set());

  const { liveResponsesMap, addLiveStreamResponse, removeLiveStreamResponse } =
    useStoreLiveStreamResponses();

  useKeepLiveVideosAlive(liveResponsesMap, {
    enabled: playerOptions.isLiveStream,
  });

  const { data: mostRecentThumbnails } = useMostRecentThumbnailsEnlarged({
    camera_mac_addresses: pageCameraResponses.map(
      (source) => source.camera.mac_address
    ),
    enabled: true,
  });

  function onCameraHDIconClick(
    camera_id: number,
    resolution: VideoResRequestType
  ) {
    if (resolution === VideoResRequestType.HIGH) {
      setHdCameraIds(new Set([camera_id]));
    } else {
      setHdCameraIds(new Set());
    }
  }

  const players = pageCameraResponses.map((cameraResponse) => (
    <FullScreenVideoPlayer
      id={cameraResponse.camera.id}
      key={cameraResponse.camera.id}
      VideoPlayer={VideoPlayer}
      videoName={cameraResponse.camera.name || defaultVideoName}
      kinesisUrlSource={{
        camera: cameraResponse.camera,
        kinesisOptions: {
          requestType: "live",
          mac_address: cameraResponse.camera.mac_address,
          resolution_config: hdCameraIds.has(cameraResponse.camera.id)
            ? HIGH_RESOLUTION_CONFIG
            : LOW_RESOLUTION_CONFIG,
          log_live_activity: false,
          prefer_webrtc: preferWebrtc,
        },
      }}
      onHDIconClick={
        DISABLE_SWITCH_TO_HD
          ? undefined
          : (resolution) =>
              onCameraHDIconClick(cameraResponse.camera.id, resolution)
      }
      playerOptions={playerOptions}
      isAudioEnabled={cameraResponse.camera.is_audio_enabled}
      posterUrl={
        mostRecentThumbnails?.get(cameraResponse.camera.mac_address)
          ?.s3_signed_url
      }
      allowPanZoom={isAnythingFullscreen}
      onClick={() => {
        if (!isAnythingFullscreen) {
          navigate(`/timeline/${cameraResponse.camera.id}`);
        }
      }}
      onResponseFetched={addLiveStreamResponse}
      onKinesisUrlSourceRemove={removeLiveStreamResponse}
      videoPlayerContainerSx={{
        cursor: "pointer",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    />
  ));

  return (
    <FullScreenProvider>
      {/*
      this wrapper is need for safari, see
      https://stackoverflow.com/questions/44770074/css-grid-row-height-safari-bug */}
      <Box sx={{ width: width }} ref={ref}>
        <Box
          display="grid"
          gridTemplateColumns={`repeat(${videoPerRow}, minmax(0, 1fr))`}
          gridTemplateRows={
            isAllVideosFullScreenModeActive ? `${100 / rowsPerPage}vh` : "auto"
          }
          gridAutoRows={
            isAllVideosFullScreenModeActive ? `${100 / rowsPerPage}vh` : "auto"
          }
          gap={isAllVideosFullScreenModeActive ? "2px" : 1}
        >
          {players}
        </Box>
        {isAllVideosFullScreenModeActive && (
          <FullScreenExitButton containerRef={ref} />
        )}
      </Box>
    </FullScreenProvider>
  );
});
