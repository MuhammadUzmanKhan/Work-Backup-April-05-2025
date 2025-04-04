import {
  UserWallService,
  WallTile,
  isDefined,
  useCamerasList,
} from "coram-common-utils";
import {
  SYNC_FREQUENCY_MS,
  VideoSettings,
} from "contexts/video_settings_context";
import { DateTime } from "luxon";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "react-query";
import { useOnMount } from "./lifetime";
import { ClipTimeSyncData } from "utils/time";

const EMPTY_TILES: WallTile[] = [];

// Fetch all the cameras of a given organization
export function useAllCameras() {
  const cameraResponses = useCamerasList({
    locationId: null,
    excludeDisabled: false,
    refetchOnWindowFocus: false,
  }).data;
  return cameraResponses || [];
}

// Fetch the user's walls (with shared walls information)
const EMPTY_USER_WALLS = { walls: [], shared_walls: [] };

export function useUserWalls() {
  const query = useQuery(
    ["user_walls"],
    async () => {
      return await UserWallService.retrieveUserWalls();
    },
    {
      retry: 3,
      placeholderData: useCallback(() => {
        return {
          walls: [],
          shared_walls: [],
        };
      }, []),
      refetchOnWindowFocus: false,
    }
  );
  return { ...query, data: query.data || EMPTY_USER_WALLS };
}

// Fetch all the tiles of a given wall
export function useFetchWallTiles(wall_id: number | null) {
  const { data, refetch } = useQuery(
    ["wall_tiles", wall_id],
    async () => {
      if (wall_id !== null) {
        return await UserWallService.retrieveWallDetails(wall_id);
      } else {
        return EMPTY_TILES;
      }
    },
    {
      retry: 3,
      staleTime: Infinity,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }
  );
  return {
    data: data !== undefined ? data : EMPTY_TILES,
    refetch,
  };
}

export function useInitializeVideoSettings(
  clipTimeSyncData: ClipTimeSyncData | null,
  liveVideoSettings: VideoSettings | (() => VideoSettings)
) {
  const [videoSettings, setVideoSettings] =
    useState<VideoSettings>(liveVideoSettings);
  const [isPlayerVisible, setIsPlayerVisible] = useState<boolean>(false);

  // If we have a sync time, apply it on mount
  useOnMount(() => {
    if (!isDefined(clipTimeSyncData)) {
      return;
    }
    setVideoSettings((videoSettings) => ({
      ...videoSettings,
      playerOptions: {
        ...videoSettings.playerOptions,
        isLiveStream: false,
        hideTime: false,
      },
      timeInterval: clipTimeSyncData.timeInterval,
      isPlaying: true,
      playbackRate: 1,
      syncTime: clipTimeSyncData.syncTime,
    }));
    setIsPlayerVisible(true);
  });

  return {
    videoSettings,
    setVideoSettings,
    isPlayerVisible,
    setIsPlayerVisible,
  };
}

export function useUpdateSyncTime(
  syncTime: DateTime,
  playbackRate: number,
  enabled: boolean,
  onTimeUpdate: (time: DateTime) => void
) {
  // NOTE(@lberg): we Need These values to be up to date
  // But we can't depend on them as they either change
  // on every render or would cause an infinite loop
  const syncTimeRef = useRef(syncTime);
  const onSeekRef = useRef(onTimeUpdate);

  onSeekRef.current = onTimeUpdate;
  syncTimeRef.current = syncTime;

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const interval = setInterval(() => {
      onSeekRef.current(
        syncTimeRef.current.plus({
          milliseconds: SYNC_FREQUENCY_MS * playbackRate,
        })
      );
    }, SYNC_FREQUENCY_MS);
    return () => clearInterval(interval);
  }, [enabled, playbackRate]);
}
