import {
  ThumbnailResponse,
  onKinesisUrlSourceRemoveFn,
  OnStreamResponseFetchedFn,
  KinesisUrlSource,
  PlayerCamera,
} from "coram-common-utils";
import { ThumbnailOverlay } from "components/video/ThumbnailOverlay";
import {
  CanvasDrawProps,
  VideoPlayerProps,
} from "components/video/VideoPlayer";
import { useIsFullScreen } from "hooks/full_screen";
import { ComponentType } from "react";
import { VideoPlayerOptions } from "utils/player_options";

type WallVideoBoxProps<T extends VideoPlayerProps = VideoPlayerProps> = {
  isEditMode: boolean;
  camera: PlayerCamera;
  posterThumbnail?: ThumbnailResponse;
  shouldFetchThumbnails: boolean;
  getKinesisUrlSource: (camera: PlayerCamera) => KinesisUrlSource;
  getPlayerOptions: () => VideoPlayerOptions;
  VideoPlayer: ComponentType<T>;
  videoPlayerProps?: Partial<T>;
  onResponseFetched?: OnStreamResponseFetchedFn;
  onKinesisUrlSourceRemove?: onKinesisUrlSourceRemoveFn;
};

export function WallVideoBox<T extends VideoPlayerProps = VideoPlayerProps>({
  camera,
  isEditMode,
  posterThumbnail,
  shouldFetchThumbnails,
  getKinesisUrlSource,
  getPlayerOptions,
  VideoPlayer,
  videoPlayerProps,
  onResponseFetched,
  onKinesisUrlSourceRemove,
}: WallVideoBoxProps<T>) {
  const isFullScreen = useIsFullScreen();

  const videoPlayerPropsConstructed = {
    kinesisUrlSource: getKinesisUrlSource(camera),
    playerOptions: getPlayerOptions(),
    videoName: camera.name,
    allowPanZoom: isFullScreen,
    posterUrl: posterThumbnail?.s3_signed_url,
    onResponseFetched,
    onKinesisUrlSourceRemove,
    canvasDraw: ({ videoSize }: CanvasDrawProps) =>
      shouldFetchThumbnails ? (
        <ThumbnailOverlay size={videoSize} macAddress={camera.mac_address} />
      ) : null,
    ...videoPlayerProps,
  } as T;

  return (
    <VideoPlayer
      {...videoPlayerPropsConstructed}
      videoPlayerContainerSx={{
        ...videoPlayerPropsConstructed.videoPlayerContainerSx,
        cursor: isEditMode ? "auto" : "pointer",
      }}
    />
  );
}
