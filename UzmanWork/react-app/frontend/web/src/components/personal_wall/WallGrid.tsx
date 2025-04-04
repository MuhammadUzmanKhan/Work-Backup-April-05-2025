import { Box, Typography } from "@mui/material";
import type { SxProps } from "@mui/system";
import {
  VideoResRequestType,
  WallTile,
  isDefined,
  HIGH_RESOLUTION_CONFIG,
  isKinesisLiveRequest,
  KinesisUrlFromStream,
  LOW_RESOLUTION_CONFIG,
  PlayerCamera,
  onKinesisUrlSourceRemoveFn,
  OnStreamResponseFetchedFn,
  useMostRecentThumbnailsEnlarged,
} from "coram-common-utils";
import { GridTile } from "./utils/GridTile";

import { WallSkeleton } from "./utils/WallSkeleton";
import { parseWallTiles } from "./utils/utils";
import {
  ComponentType,
  ForwardedRef,
  forwardRef,
  ReactNode,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { FullScreenProvider, FullScreenVideoPlayer } from "components/common";
import { FullScreenExitButton } from "components/FullScreenExitButton";
import { useIsFullScreen } from "hooks/full_screen";
import { VideoPlayerOptions } from "utils/player_options";
import { VideoPlayerProps } from "components/video/VideoPlayer";

const GRID_GUTTER_PX = 16;
// TODO(@lberg): remove this, currently we can't support
const DISABLE_SWITCH_TO_HD = true;

interface WallGridProps {
  cameras: PlayerCamera[];
  canEdit: boolean;
  tiles: WallTile[];
  onGridChange?: (
    indices: number[],
    macAddresses: (string | undefined)[]
  ) => void;
  onCameraClick?: (camera: PlayerCamera) => void;
  sx?: SxProps;
  shouldFetchThumbnails: boolean;
  getKinesisUrlSource: (camera: PlayerCamera) => KinesisUrlFromStream;
  getPlayerOptions: () => VideoPlayerOptions;
  VideoPlayer: ComponentType<VideoPlayerProps>;
  getEmptyWallContent: () => ReactNode;
  thumbnailsEnabled?: boolean;
  gridGutterPx?: number;
  fitParentHeight?: boolean;
  onResponseFetched?: OnStreamResponseFetchedFn;
  onKinesisUrlSourceRemove?: onKinesisUrlSourceRemoveFn;
}

// A grid of tiles
export const WallGrid = forwardRef(function WallGrid(
  {
    cameras,
    canEdit,
    tiles,
    onGridChange,
    onCameraClick,
    sx,
    shouldFetchThumbnails,
    getKinesisUrlSource,
    getPlayerOptions,
    VideoPlayer,
    getEmptyWallContent,
    thumbnailsEnabled = true,
    gridGutterPx = GRID_GUTTER_PX,
    fitParentHeight,
    onResponseFetched,
    onKinesisUrlSourceRemove,
  }: WallGridProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  // Expose the ref outside but keep it as a RefObject here
  const ref = useRef<HTMLInputElement>(null);
  useImperativeHandle(forwardedRef, () => ref.current as HTMLInputElement);

  const [isDragging, setIsDragging] = useState(false);
  const [hdMacAddresses, setHdMacAddresses] = useState<Set<string>>(new Set());

  const isAnythingFullScreen = useIsFullScreen();

  const isAllVideosFullScreenModeActive =
    isAnythingFullScreen && document.fullscreenElement === ref.current;
  // Invoked when a camera is dropped on a tile
  // to update the wall config.
  // A drag & drop happens between a source and a target tile,
  // where the source tile can be fillexd or unfilled.
  function onMacAddressDrop(
    targetIndex: number,
    sourceMacAddress: string,
    sourceIndex?: number,
    targetMacAddress?: string
  ) {
    const dragIndices = [targetIndex];
    const macAddresses: (string | undefined)[] = [sourceMacAddress];

    // Drag and drop comes from another tile (not the drawer),
    // -> switch tiles.
    if (sourceIndex !== undefined) {
      dragIndices.push(sourceIndex);
      macAddresses.push(targetMacAddress);
    }

    onGridChange?.(dragIndices, macAddresses);
    setIsDragging(false);
  }

  // Invoked when a camera is removed from a tile
  function onMacAddressRemove(idxInGrid: number) {
    onGridChange?.([idxInGrid], [undefined]);
  }

  // Invoked when drag and drop starts
  function onMacAddressDragStart() {
    setIsDragging(true);
  }

  function getKinesisUrlSourceForCamera(camera: PlayerCamera) {
    const kinesisSource = getKinesisUrlSource(camera);
    if (!isKinesisLiveRequest(kinesisSource.kinesisOptions)) {
      return kinesisSource;
    }
    // if we have a live request, we need to adjust the resolution config
    // if we are requesting high resolution
    return {
      ...kinesisSource,
      kinesisOptions: {
        ...kinesisSource.kinesisOptions,
        resolution_config: hdMacAddresses.has(camera.mac_address)
          ? HIGH_RESOLUTION_CONFIG
          : LOW_RESOLUTION_CONFIG,
      },
    };
  }

  const numColsGrid = tiles.reduce(
    (acc, tile) => Math.max(acc, tile.x_start_tile + tile.width_tiles),
    0
  );
  const numRowsGrid = tiles.reduce(
    (acc, tile) => Math.max(acc, tile.y_start_tile + tile.height_tiles),
    0
  );

  const tilesInEmptyRow = parseWallTiles(tiles);

  const macAddressToCameraLookup = useMemo(() => {
    return cameras.reduce(
      (acc, camera) => acc.set(camera.mac_address, camera),
      new Map<string, PlayerCamera>()
    );
  }, [cameras]);

  const { data: mostRecentThumbnails } = useMostRecentThumbnailsEnlarged({
    camera_mac_addresses: tiles
      .map((tile) => tile.camera_mac_address)
      .filter(isDefined),
    enabled: thumbnailsEnabled,
  });
  // Gutter are not included in percentage calculations, so we need to compensate for them.
  const gutterCompensationPx = (numRowsGrid - 1) * gridGutterPx;
  // In full screen, assume we have no gutter and viewport size.
  // Otherwise, compensate for the gutter and use percentage of parent if fitParentHeight is true else set height to
  // auto for responsive height.
  let gridRowHeight;
  if (isAllVideosFullScreenModeActive) {
    gridRowHeight = `${100 / numRowsGrid}vh`;
  } else if (fitParentHeight) {
    gridRowHeight = `calc((100% - ${gutterCompensationPx}px) / ${numRowsGrid})`;
  } else {
    gridRowHeight = "auto";
  }

  function onHDIconClick(mac_address: string, resolution: VideoResRequestType) {
    setHdMacAddresses(new Set());
    if (resolution === VideoResRequestType.HIGH) {
      setHdMacAddresses(new Set([mac_address]));
    }
  }

  return (
    <>
      <Box
        display="grid"
        position="relative"
        gap={isAllVideosFullScreenModeActive ? "2px" : `${gridGutterPx}px`}
        gridTemplateColumns={`repeat(${numColsGrid}, minmax(0, 1fr))`}
        gridTemplateRows={`repeat(${numRowsGrid}, ${gridRowHeight})`}
        sx={sx}
        ref={ref}
      >
        <Typography
          variant="h2"
          position="absolute"
          top="43%"
          width="100%"
          textAlign="center"
          color="lightgray"
          sx={{
            pointerEvents: "none",
          }}
        >
          {tiles.filter((tile) => tile.camera_mac_address).length > 0 ? (
            ""
          ) : (
            <>{getEmptyWallContent()}</>
          )}
        </Typography>

        {tiles.length > 0 ? (
          <FullScreenProvider>
            {tiles.map((tile, idx) => {
              const camera = isDefined(tile.camera_mac_address)
                ? macAddressToCameraLookup.get(tile.camera_mac_address)
                : undefined;
              const thumbnail = tile.camera_mac_address
                ? mostRecentThumbnails?.get(tile.camera_mac_address)
                : undefined;
              return (
                <GridTile
                  key={tile.camera_mac_address || idx}
                  idxInGrid={idx}
                  tile={tile}
                  camera={camera}
                  canEdit={canEdit}
                  onMacAddressDrop={onMacAddressDrop}
                  onMacAddressRemove={onMacAddressRemove}
                  rowIsEmpty={tilesInEmptyRow[idx]}
                  isDragging={isDragging || canEdit}
                  onMacAddressDragStart={onMacAddressDragStart}
                  thumbnail={thumbnail}
                  shouldFetchThumbnails={shouldFetchThumbnails}
                  getKinesisUrlSource={getKinesisUrlSourceForCamera}
                  getPlayerOptions={getPlayerOptions}
                  VideoPlayer={FullScreenVideoPlayer}
                  videoPlayerProps={{
                    videoPlayerContainerSx: {
                      height: "100%",
                    },
                    id: idx,
                    VideoPlayer,
                    onClick: () => {
                      if (!isAnythingFullScreen) {
                        camera && onCameraClick?.(camera);
                      }
                    },
                    onHDIconClick: DISABLE_SWITCH_TO_HD
                      ? undefined
                      : (resolution) =>
                          camera &&
                          onHDIconClick(camera.mac_address, resolution),
                    allowPanZoom: isAnythingFullScreen,
                  }}
                  onResponseFetched={onResponseFetched}
                  onKinesisUrlSourceRemove={onKinesisUrlSourceRemove}
                />
              );
            })}
            {isAllVideosFullScreenModeActive && (
              <FullScreenExitButton containerRef={ref} />
            )}
          </FullScreenProvider>
        ) : (
          <WallSkeleton />
        )}
      </Box>
    </>
  );
});
