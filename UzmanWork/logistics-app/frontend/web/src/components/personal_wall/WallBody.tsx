import {
  CameraResponse,
  UserWallService,
  WallTile,
  getPlayerCamera,
  KinesisUrlFromStream,
  LOW_RESOLUTION_CONFIG,
  PlayerCamera,
  useStoreLiveStreamResponses,
  useKeepLiveVideosAlive,
} from "coram-common-utils";
import { formatDateTime } from "utils/dates";
import { WallGrid } from "./WallGrid";
import { WallDrawer } from "./WallDrawer";
import {
  VideoSettings,
  VideoSettingsContext,
} from "contexts/video_settings_context";
import { Dispatch, SetStateAction, useState } from "react";
import { BottomSticky } from "./multi_video_controls/BottomSticky";
import { MultiVideoControlsBar } from "./multi_video_controls/MultiVideoControlsBar";
import { onNewTime } from "utils/multi_video_controls";
import { useNavigate } from "react-router-dom";
import { useUpdateSyncTime } from "hooks/personal_wall";
import { DateTime } from "luxon";
import { getTimezoneFromTiles } from "./utils/utils";
import {
  DEFAULT_TRIAGE_DRAG_STATUS,
  TriageDragContext,
  TriageDragStatus,
} from "contexts/triage_drag_context";
import { Typography } from "@mui/material";
import { ClipTimeSyncData } from "utils/time";

import { ControllableVideoPlayer } from "components/video/ControllableVideoPlayer";
import { PLAYER_OPTIONS_NO_INTERACTIONS } from "utils/player_options";

interface WallBodyProps {
  canEdit: boolean;
  isAddMode: boolean;
  cameras: CameraResponse[];
  drawerWidth: string | number;
  onEditDone: VoidFunction;
  currentWallId: number;
  tiles: WallTile[];
  refetchTiles: VoidFunction;
  onNewWallCancel: VoidFunction;
  videoSettings: VideoSettings;
  setVideoSettings: Dispatch<SetStateAction<VideoSettings>>;
  showPlayer: boolean;
  setClipSyncData: Dispatch<SetStateAction<ClipTimeSyncData | null>>;
  switchToLive: VoidFunction;
  gridWidth?: number | string;
  wallGridContainer: React.RefObject<HTMLDivElement>;
}

// Component to show a user wall
export function WallBody({
  canEdit,
  isAddMode,
  cameras,
  drawerWidth,
  onEditDone,
  currentWallId,
  tiles,
  refetchTiles,
  onNewWallCancel,
  videoSettings,
  setVideoSettings,
  showPlayer,
  setClipSyncData,
  switchToLive,
  gridWidth = "100%",
  wallGridContainer,
}: WallBodyProps) {
  const [triageDragStatus, setTriageDragStatus] = useState<TriageDragStatus>(
    DEFAULT_TRIAGE_DRAG_STATUS
  );

  const navigate = useNavigate();
  const timezone = getTimezoneFromTiles(cameras, tiles);

  const { liveResponsesMap, addLiveStreamResponse, removeLiveStreamResponse } =
    useStoreLiveStreamResponses();

  useKeepLiveVideosAlive(liveResponsesMap, {
    enabled: videoSettings.playerOptions.isLiveStream,
  });

  // Called when tiles are changed via drag & drop
  async function onGridChange(
    gridIndices: number[],
    macAddresses: (string | undefined)[]
  ) {
    const updateTiles = [...tiles];
    for (let i = 0; i < gridIndices.length; i++) {
      updateTiles[gridIndices[i]] = {
        ...tiles[gridIndices[i]],
        camera_mac_address: macAddresses[i],
      };
    }
    try {
      await UserWallService.editTiles(currentWallId, updateTiles);
      await refetchTiles();
    } catch (e) {
      console.error(e);
    }
  }

  async function onSeek(newTime: DateTime) {
    const result = onNewTime(newTime, videoSettings.timeInterval);
    switch (result.command) {
      case "in_clip":
        setVideoSettings((prev) => ({
          ...prev,
          syncTime: result.time,
          playerOptions: {
            ...prev.playerOptions,
            isLiveStream: false,
            htmlPlayerOptions: PLAYER_OPTIONS_NO_INTERACTIONS,
          },
        }));
        setClipSyncData((prev) =>
          prev ? { ...prev, syncTime: result.time } : null
        );

        break;
      case "out_clip":
        {
          setVideoSettings((prev) => ({
            ...prev,
            playerOptions: {
              ...prev.playerOptions,
              isLiveStream: false,
              hideTime: false,
              htmlPlayerOptions: PLAYER_OPTIONS_NO_INTERACTIONS,
            },
            timeInterval: result.timeInterval,
            isPlaying: true,
            syncTime: result.timeInterval.timeStart,
          }));
        }
        setClipSyncData({
          timeInterval: result.timeInterval,
          syncTime: result.timeInterval.timeStart,
        });
        break;
      case "in_future":
        switchToLive();
        break;
      default: {
        const _exhaustiveCheck: never = result;
        return _exhaustiveCheck;
      }
    }
  }

  // Periodically update sync time
  useUpdateSyncTime(
    videoSettings.syncTime,
    videoSettings.playbackRate,
    videoSettings.isPlaying,
    (time) => {
      setVideoSettings((prev) => ({
        ...prev,
        syncTime: time,
      }));
      if (!videoSettings.playerOptions.isLiveStream) {
        onSeek(time);
      }
    }
  );

  function onCameraClick(camera: PlayerCamera) {
    if (canEdit) {
      return;
    }
    if (videoSettings.playerOptions.isLiveStream) {
      setClipSyncData(null);
    }

    // Find the cameraResponse corresponding to the clicked camera based on
    // the mac address
    const cameraResponse = cameras.find(
      (cameraResponse) =>
        cameraResponse.camera.mac_address === camera.mac_address
    );

    // Log error if we can't find the cameraResponse
    if (!cameraResponse) {
      console.error(
        `Can't find camera response for camera ${camera.mac_address}` +
          ` in cameras ${cameras.map((camera) => camera.camera.mac_address)}`
      );
      return;
    }

    navigate(`/timeline/${cameraResponse.camera.id}`, {
      state: {
        multiPlayerWasShown: showPlayer,
      },
    });
  }

  const isLive = videoSettings.playerOptions.isLiveStream;

  function getKinesisUrlSource(camera: PlayerCamera): KinesisUrlFromStream {
    return {
      camera: camera,
      kinesisOptions: isLive
        ? {
            requestType: "live" as const,
            mac_address: camera.mac_address,
            log_live_activity: false,
            prefer_webrtc: true,
            resolution_config: LOW_RESOLUTION_CONFIG,
          }
        : {
            requestType: "clip" as const,
            mac_address: camera.mac_address,
            start_time: formatDateTime(videoSettings.timeInterval.timeStart),
            end_time: formatDateTime(videoSettings.timeInterval.timeEnd),
            resolution_config: LOW_RESOLUTION_CONFIG,
          },
    };
  }

  function getEmptyWallContent() {
    return (
      <>
        <img src="/static/touch-gesture.png" height="70px" />
        <Typography color="neutral.700" variant="body1" fontWeight="bold">
          Drag and Drop to fill boxes
        </Typography>
      </>
    );
  }

  return (
    <>
      <TriageDragContext.Provider
        value={{ triageDragStatus, setTriageDragStatus }}
      >
        <VideoSettingsContext.Provider value={videoSettings}>
          <WallGrid
            canEdit={canEdit}
            cameras={cameras.map((camera) => getPlayerCamera(camera))}
            tiles={tiles}
            onGridChange={onGridChange}
            onCameraClick={onCameraClick}
            sx={{
              width: gridWidth,
            }}
            shouldFetchThumbnails={showPlayer}
            getKinesisUrlSource={getKinesisUrlSource}
            getPlayerOptions={() => ({
              ...videoSettings.playerOptions,
              hideLiveIndicator: triageDragStatus.isDragging,
            })}
            ref={wallGridContainer}
            VideoPlayer={ControllableVideoPlayer}
            getEmptyWallContent={getEmptyWallContent}
            onResponseFetched={addLiveStreamResponse}
            onKinesisUrlSourceRemove={removeLiveStreamResponse}
          />
        </VideoSettingsContext.Provider>
        {showPlayer && (
          <BottomSticky>
            <MultiVideoControlsBar
              isLive={isLive}
              isPlaying={videoSettings.isPlaying}
              playbackRate={videoSettings.playbackRate}
              syncTime={videoSettings.syncTime}
              onLiveClick={switchToLive}
              onPlaybackRateControlClick={(value) =>
                setVideoSettings((prev) => ({
                  ...prev,
                  playbackRate: value,
                }))
              }
              onSeekControlClick={(offset) =>
                onSeek(videoSettings.syncTime.plus({ seconds: offset }))
              }
              onPlayClick={() => {
                if (isLive) return;
                setVideoSettings((prev) => ({
                  ...prev,
                  isPlaying: true,
                }));
              }}
              onPauseClick={() => {
                if (isLive) return;
                setVideoSettings((prev) => ({ ...prev, isPlaying: false }));
              }}
              onTimeBarClick={(time) => onSeek(time)}
              timezone={timezone}
              clipTimeInterval={videoSettings.timeInterval}
              onStartScrubbing={() => {
                setVideoSettings((prev) => ({
                  ...prev,
                  isPlaying: prev.playerOptions.isLiveStream,
                }));
              }}
              onStopScrubbing={() =>
                setVideoSettings((prev) => ({
                  ...prev,
                  isPlaying: true,
                }))
              }
            />
          </BottomSticky>
        )}
        {canEdit && (
          <WallDrawer
            cameras={cameras.filter((camera) => camera.camera.is_enabled)}
            tiles={tiles}
            width={drawerWidth}
            onSubmitClick={onEditDone}
            onNewWallCancel={isAddMode ? onNewWallCancel : undefined}
          />
        )}
      </TriageDragContext.Provider>
    </>
  );
}
