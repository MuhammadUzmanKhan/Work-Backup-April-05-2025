import {
  KioskPublicService,
  StaticResolutionConfig,
  Wall,
  WallTile,
  KinesisUrlFromKioskHash,
  PlayerCamera,
  useStoreLiveStreamResponses,
  LiveStreamResponseData,
  useKeepLiveVideosAlive,
} from "coram-common-utils";
import { WallGrid } from "components/personal_wall/WallGrid";

import { VideoPlayer } from "components/video/VideoPlayer";
import {
  PLAYER_OPTIONS_NO_INTERACTIONS,
  VideoPlayerOptions,
} from "utils/player_options";
import { ForwardedRef, forwardRef } from "react";
import { Typography } from "@mui/material";

const KIOSK_PLAYER_OPTIONS: VideoPlayerOptions = {
  htmlPlayerOptions: PLAYER_OPTIONS_NO_INTERACTIONS,
  isLiveStream: true,
  hideTime: true,
};

interface KioskWallProps {
  kioskHash: string;
  wall: Wall;
  cameras: PlayerCamera[];
  tiles: WallTile[];
  resolutionConfig: StaticResolutionConfig;
  preferWebRTC: boolean;
}

export const KioskWall = forwardRef(function KioskWall(
  {
    kioskHash,
    wall,
    cameras,
    tiles,
    resolutionConfig,
    preferWebRTC,
  }: KioskWallProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const { liveResponsesMap, addLiveStreamResponse, removeLiveStreamResponse } =
    useStoreLiveStreamResponses();

  useKeepLiveVideosAlive(liveResponsesMap, {
    enabled: true,
    keepAliveFn: (hlsResponses: [string, LiveStreamResponseData][]) =>
      KioskPublicService.keepWallAlive(kioskHash, {
        wall_id: wall.id,
        mac_addresses: hlsResponses.map(([mac_address]) => mac_address),
        resolution_config: resolutionConfig,
      }),
  });

  function getKinesisUrlSource(camera: PlayerCamera): KinesisUrlFromKioskHash {
    return {
      kioskHash: kioskHash,
      camera: camera,
      kinesisOptions: {
        requestType: "live" as const,
        mac_address: camera.mac_address,
        resolution_config: resolutionConfig,
        log_live_activity: false,
        prefer_webrtc: preferWebRTC,
      },
    };
  }

  function getEmptyWallContent() {
    return (
      <Typography color="neutral.300" variant="body1" fontWeight="bold">
        Add tiles to this wall to see your cameras
      </Typography>
    );
  }

  return (
    <WallGrid
      ref={forwardedRef}
      canEdit={false}
      cameras={cameras}
      tiles={tiles}
      sx={{
        height: "100%",
      }}
      shouldFetchThumbnails={false}
      getKinesisUrlSource={getKinesisUrlSource}
      getPlayerOptions={() => KIOSK_PLAYER_OPTIONS}
      thumbnailsEnabled={false}
      VideoPlayer={VideoPlayer}
      getEmptyWallContent={getEmptyWallContent}
      gridGutterPx={0}
      fitParentHeight={true}
      onResponseFetched={addLiveStreamResponse}
      onKinesisUrlSourceRemove={removeLiveStreamResponse}
    />
  );
});
