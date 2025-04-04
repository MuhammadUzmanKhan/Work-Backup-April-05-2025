import { Box } from "@mui/material";
import {
  UserWallService,
  UserWallsResponse,
  isDefined,
} from "coram-common-utils";
import { WallDefaultView } from "components/personal_wall/WallDefaultView";
import { WallHeader } from "components/personal_wall/WallHeader";
import { WallBody } from "components/personal_wall/WallBody";
import { WallSkeleton } from "components/personal_wall/utils/WallSkeleton";
import {
  GeneralWallResponse,
  concatAndSortWalls,
  findFreeWallName,
  wallsEmpty,
  getNextWall,
} from "components/personal_wall/utils/utils";
import { matchApiException } from "utils/error_handling";
import {
  useAllCameras,
  useFetchWallTiles,
  useInitializeVideoSettings,
  useUserWalls,
} from "hooks/personal_wall";
import { useContext, useRef, useState } from "react";
import { WALL_THREE_BY_THREE } from "components/personal_wall/utils/WallTemplates";
import { useSearchParams } from "utils/search_params";
import { getLiveVideoSettings } from "contexts/video_settings_context";
import { useRecoilState } from "recoil";
import { clipTimeSyncDataState } from "utils/globals";
import {
  getWallGridWidthInStorage,
  setWallGridWidthInStorage,
} from "utils/local_storage";
import { NotificationContext } from "contexts/notification_context";
import { useOnMount, useOnUnmount } from "hooks/lifetime";
import { useFullScreenToggle } from "hooks/full_screen";
import { useIsLimitedUser } from "components/layout/RoleGuards";
import { TOOLBAR_HEIGHT_PX } from "components/navbar/navbar";

export enum WallPageMode {
  NEW_WALL = "new_wall",
  EDIT_WALL = "edit_wall",
  SHOW = "show",
  DEFAULT = "default",
}

function PersonalWallView({
  userWalls,
  refetchUserWalls,
}: {
  userWalls: UserWallsResponse;
  refetchUserWalls: () => void;
}) {
  const hasAtLeastLimitedRights = useIsLimitedUser();
  const { setNotificationData } = useContext(NotificationContext);

  const { searchParams, setSearchParams } = useSearchParams();
  const allCameras = useAllCameras();
  const [clipSyncData, setClipSyncData] = useRecoilState(clipTimeSyncDataState);
  const {
    videoSettings,
    setVideoSettings,
    isPlayerVisible,
    setIsPlayerVisible,
  } = useInitializeVideoSettings(clipSyncData, () => getLiveVideoSettings());

  // The mode of the page
  const [mode, setMode] = useState<WallPageMode>(WallPageMode.SHOW);

  // The id of the currently selected wall
  const [currentWallId, setCurrentWallId] = useState<number | null>(null);

  const [gridWidthPerc, setGridWidthPerc] = useState<number>(
    getWallGridWidthInStorage(currentWallId)
  );
  const wallGridContainer = useRef<HTMLDivElement>(null);
  useFullScreenToggle(wallGridContainer);

  function updateWallId(wallId: number) {
    setCurrentWallId(wallId);
    setGridWidthPerc(getWallGridWidthInStorage(wallId));
    setSearchParams({ wallId: `${wallId}` });
  }

  // The tiles of the currently selected wall
  const { data: tiles, refetch: refetchTiles } =
    useFetchWallTiles(currentWallId);

  useOnMount(() => {
    if (wallsEmpty(userWalls)) {
      setMode(WallPageMode.DEFAULT);
      return;
    }

    const wallIdParams = searchParams.get("wallId");
    if (wallIdParams) {
      const wallId = parseInt(wallIdParams);
      updateWallId(wallId);
      return;
    }
    const wallId = userWalls.walls[0]
      ? userWalls.walls[0].wall.id
      : userWalls.shared_walls[0].wall.id;
    updateWallId(wallId);
  });

  // Function to abort adding a new wall
  async function onNewWallAbort({ forceDelete }: { forceDelete: boolean }) {
    if (mode !== WallPageMode.NEW_WALL || !isDefined(currentWallId)) {
      return;
    }
    const hasTiles = tiles.filter((tile) => tile.camera_mac_address).length;
    if (hasTiles && !forceDelete) {
      setMode(WallPageMode.SHOW);
      return;
    }
    await UserWallService.deleteWall(currentWallId);
    refetchUserWalls();
    setMode(WallPageMode.SHOW);
  }

  useOnUnmount(() => onNewWallAbort({ forceDelete: false }));

  // Transition to show mode when a wall is selected
  function onWallClick(wall: GeneralWallResponse) {
    setMode(WallPageMode.SHOW);
    updateWallId(wall.wall.id);
    setClipSyncData(null);
    setVideoSettings((prev) => {
      const newSettings = { ...prev };
      newSettings.playerOptions.htmlPlayerOptions.autoplay = true;
      return newSettings;
    });
  }

  // Create new wall when add button is clicked
  async function onCreateWallClick() {
    try {
      const newWallId = await UserWallService.createWall({
        name: findFreeWallName(userWalls.walls.map((wall) => wall.wall.name)),
        wall_tiles: WALL_THREE_BY_THREE.wall_tiles,
      });
      refetchUserWalls();
      updateWallId(newWallId);
      setMode(WallPageMode.NEW_WALL);
    } catch (e) {
      const errorMessage = matchApiException(
        e,
        "A wall with this name already exists"
      )
        ? "A wall with this name already exists!"
        : "Something went wrong while creating the wall!";
      setNotificationData({
        message: errorMessage,
        severity: "error",
      });
    }
  }

  function onEditWallClick(wall: GeneralWallResponse) {
    setMode(WallPageMode.EDIT_WALL);
    updateWallId(wall.wall.id);
  }

  // Function to leave wall editing
  function onEditDone() {
    setMode(WallPageMode.SHOW);
  }

  function onWallRemoved(deletedWallId: number) {
    if (currentWallId === deletedWallId) {
      const sortedWalls = concatAndSortWalls(
        userWalls.walls,
        userWalls.shared_walls
      );

      // Deleted wall was the only one, show default view.
      if (sortedWalls.length == 1) {
        setCurrentWallId(null);
        setMode(WallPageMode.DEFAULT);
        return;
      }

      // There was at least one other wall -> show previous or next wall.
      const nextWallIdx = getNextWall(sortedWalls, deletedWallId);
      if (nextWallIdx == -1) {
        throw new Error("Error in getNextWall");
      }
      updateWallId(nextWallIdx);
    }
  }

  function setAndSaveGridWidthPerc(newSize: number) {
    setGridWidthPerc(newSize);
    setWallGridWidthInStorage(currentWallId, newSize);
  }

  const canEdit =
    mode === WallPageMode.EDIT_WALL || mode === WallPageMode.NEW_WALL;
  const drawerWidth = canEdit ? "16rem" : 0;

  function switchToLive() {
    setVideoSettings(getLiveVideoSettings());
  }

  function onChangePlayerVisibility(playerVisible: boolean) {
    setIsPlayerVisible(playerVisible);
    switchToLive();
  }

  return (
    <Box
      mr={drawerWidth}
      pt={4}
      px={2}
      minHeight={`calc(100vh - ${TOOLBAR_HEIGHT_PX}px)`}
    >
      {mode === WallPageMode.DEFAULT && wallsEmpty(userWalls) && (
        <WallDefaultView onCreateWallClick={onCreateWallClick} />
      )}
      {mode !== WallPageMode.DEFAULT && (
        <WallHeader
          currentWallId={currentWallId}
          mode={mode}
          onWallClick={onWallClick}
          onCreateWallClick={onCreateWallClick}
          onEditWallClick={onEditWallClick}
          onNewWallClickAway={() => onNewWallAbort({ forceDelete: false })}
          userWalls={userWalls}
          refetchUserWalls={refetchUserWalls}
          tiles={tiles}
          refetchTiles={refetchTiles}
          onWallRemoved={onWallRemoved}
          isPlayerVisible={isPlayerVisible}
          disablePlayerSwitch={canEdit || !hasAtLeastLimitedRights}
          onChangePlayerVisibility={onChangePlayerVisibility}
          gridWidthPerc={gridWidthPerc}
          onGridWidthChange={setAndSaveGridWidthPerc}
          wallGridContainer={wallGridContainer.current}
        />
      )}
      {currentWallId !== null && (
        <WallBody
          canEdit={canEdit}
          isAddMode={mode === WallPageMode.NEW_WALL}
          cameras={allCameras}
          drawerWidth={drawerWidth}
          onEditDone={onEditDone}
          tiles={tiles}
          refetchTiles={refetchTiles}
          currentWallId={currentWallId}
          onNewWallCancel={() => onNewWallAbort({ forceDelete: true })}
          videoSettings={videoSettings}
          setVideoSettings={setVideoSettings}
          showPlayer={isPlayerVisible && !canEdit}
          setClipSyncData={setClipSyncData}
          switchToLive={switchToLive}
          gridWidth={`${gridWidthPerc}%`}
          wallGridContainer={wallGridContainer}
        />
      )}
    </Box>
  );
}

export function PersonalWallPage() {
  const {
    data: userWalls,
    isFetchedAfterMount: isUserWallsFetched,
    refetch: refetchUserWalls,
  } = useUserWalls();

  return (
    <>
      {!isUserWallsFetched ? (
        <Box pt={4} px={2} minHeight={`calc(100vh - ${TOOLBAR_HEIGHT_PX}px)`}>
          <WallSkeleton />
        </Box>
      ) : (
        <PersonalWallView
          userWalls={userWalls}
          refetchUserWalls={refetchUserWalls}
        />
      )}
    </>
  );
}
