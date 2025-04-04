import { ComponentType } from "react";
import { Box, styled } from "@mui/material";
import {
  ThumbnailResponse,
  WallTile,
  isDefined,
  onKinesisUrlSourceRemoveFn,
  OnStreamResponseFetchedFn,
  KinesisUrlSource,
  PlayerCamera,
} from "coram-common-utils";
import { Cancel as CancelIcon } from "@mui/icons-material";
import { WallVideoBox } from "./WallVideoBox";
import { VideoPlayerOptions } from "utils/player_options";
import { VideoPlayerProps } from "components/video/VideoPlayer";

// GridTile and GridTileProps are generic because of videoPlayerProps which are passed to
// VideoPlayer and must follow its props. At the moment we use it in combination with
// useFullScreenVideoPanel where we augment VideoPlayer component to support rendering in Portal.
interface GridTileProps<T extends VideoPlayerProps = VideoPlayerProps> {
  tile: WallTile;
  idxInGrid: number;
  camera: PlayerCamera | undefined;
  canEdit: boolean;
  onMacAddressDrop: (
    targetIndex: number,
    sourceMacAddress: string,
    sourceIndex?: number,
    targetMacAddress?: string
  ) => void;
  onMacAddressRemove: (idxInGrid: number) => void;
  onMacAddressDragStart: VoidFunction;
  rowIsEmpty: boolean;
  isDragging: boolean;
  thumbnail?: ThumbnailResponse;
  shouldFetchThumbnails: boolean;
  getKinesisUrlSource: (camera: PlayerCamera) => KinesisUrlSource;
  getPlayerOptions: () => VideoPlayerOptions;
  VideoPlayer: ComponentType<T>;
  videoPlayerProps?: Partial<T>;
  onResponseFetched?: OnStreamResponseFetchedFn;
  onKinesisUrlSourceRemove?: onKinesisUrlSourceRemoveFn;
}

const WallPlaceholderBox = styled(Box)({
  height: "100%",
});

export function GridTile<T extends VideoPlayerProps = VideoPlayerProps>({
  tile,
  idxInGrid,
  camera,
  canEdit,
  onMacAddressDrop,
  onMacAddressRemove,
  onMacAddressDragStart,
  rowIsEmpty,
  isDragging,
  thumbnail,
  shouldFetchThumbnails,
  getKinesisUrlSource,
  getPlayerOptions,
  VideoPlayer,
  videoPlayerProps,
  onResponseFetched,
  onKinesisUrlSourceRemove,
}: GridTileProps<T>) {
  return (
    <Box
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDragEnter={(e) => {
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        const sourceMacAddress = e.dataTransfer.getData("cameraMacAddress");
        const dragStartIdx = e.dataTransfer.getData("idxInGrid");
        onMacAddressDrop(
          idxInGrid,
          sourceMacAddress,
          dragStartIdx !== "" ? Number(dragStartIdx) : undefined,
          camera?.mac_address
        );
      }}
      draggable
      onDragStart={(e) => {
        if (!isDefined(camera)) return;
        e.dataTransfer.setData("cameraMacAddress", camera.mac_address);
        e.dataTransfer.setData("idxInGrid", idxInGrid.toString());
        onMacAddressDragStart();
      }}
      sx={{
        gridColumn: `${tile.x_start_tile + 1} / span ${tile.width_tiles}`,
        gridRow: `${tile.y_start_tile + 1} / span ${tile.height_tiles}`,
        position: "relative",
      }}
    >
      {!isDefined(camera) ? (
        <WallPlaceholderBox
          sx={{
            border: isDragging ? "1px solid lightgray" : "auto",
            borderRadius: isDragging ? "8px" : "auto",
            minHeight: rowIsEmpty ? "260px" : "0px",
          }}
        ></WallPlaceholderBox>
      ) : (
        <WallVideoBox
          camera={camera}
          isEditMode={canEdit}
          posterThumbnail={thumbnail}
          shouldFetchThumbnails={shouldFetchThumbnails}
          getKinesisUrlSource={getKinesisUrlSource}
          getPlayerOptions={getPlayerOptions}
          VideoPlayer={VideoPlayer}
          videoPlayerProps={videoPlayerProps}
          onResponseFetched={onResponseFetched}
          onKinesisUrlSourceRemove={onKinesisUrlSourceRemove}
        />
      )}
      {isDefined(camera) && canEdit && (
        <CancelIcon
          sx={{
            position: "absolute",
            bottom: "10px",
            right: "10px",
            color: "common.white",
            zIndex: 2,
            cursor: "pointer",
          }}
          onClick={() => onMacAddressRemove(idxInGrid)}
        />
      )}
    </Box>
  );
}
