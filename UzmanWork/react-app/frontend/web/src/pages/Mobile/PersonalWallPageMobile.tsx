import { Box, Stack } from "@mui/material";
import { UserWallsResponse } from "coram-common-utils";
import { WallSkeleton } from "components/personal_wall/utils/WallSkeleton";
import {
  useAllCameras,
  useFetchWallTiles,
  useUserWalls,
} from "hooks/personal_wall";
import { useRef, useState } from "react";
import { useSearchParams } from "utils/search_params";

import { useOnMount } from "hooks/lifetime";
import { useFullScreenToggle } from "hooks/full_screen";
import { VideoGrid } from "components/VideoGrid";
import { PLAYER_OPTIONS_LIVE } from "utils/player_options";
import { BottomNavBar } from "components/mobile_footer/BottomNavBar";
import { WallSelectorMobile } from "components/personal_wall/mobile/WallSelectorMobile";
import { wallsEmpty } from "components/personal_wall/utils/utils";
import { WallDefaultViewMobile } from "components/personal_wall/WallDefaultViewMobile";

function PersonalWallMobileView({
  userWalls,
}: {
  userWalls: UserWallsResponse;
}) {
  const allCameras = useAllCameras();
  const { searchParams, setSearchParams } = useSearchParams();
  // The id of the currently selected wall
  const [currentWallId, setCurrentWallId] = useState<number | null>(null);

  const wallGridContainer = useRef<HTMLDivElement>(null);
  useFullScreenToggle(wallGridContainer);

  function updateWallId(wallId: number) {
    setCurrentWallId(wallId);
    setSearchParams({ wallId: `${wallId}` });
  }

  // The tiles of the currently selected wall
  const { data: tiles } = useFetchWallTiles(currentWallId);

  const wallTiles = allCameras.filter((camera) =>
    tiles.some((tile) => tile.camera_mac_address === camera.camera.mac_address)
  );

  useOnMount(() => {
    const _wallId = searchParams.get("wallId");
    if (_wallId) {
      const wallId = parseInt(_wallId);
      updateWallId(wallId);
    } else {
      const wallId = userWalls.walls[0]
        ? userWalls.walls[0].wall.id
        : userWalls.shared_walls[0].wall.id;
      updateWallId(wallId);
    }
  });

  return (
    <>
      {currentWallId !== null || tiles.length !== 0 ? (
        <Stack p={2} gap={2} minHeight="calc(100vh - 64px)">
          <WallSelectorMobile
            userWalls={userWalls}
            currentWallId={currentWallId}
            updateWallId={(wallId: number) => updateWallId(wallId)}
          />
          <VideoGrid
            page={0}
            cameraResponses={wallTiles}
            playerOptions={{
              hideStreamName: true,
              htmlPlayerOptions: PLAYER_OPTIONS_LIVE,
              isLiveStream: true,
              hideLiveIndicator: false,
              hideTime: true,
            }}
            preferWebrtc={true}
            width="100%"
            videoPerRow={1}
            rowsPerPage={wallTiles.length}
            ref={wallGridContainer}
          />
        </Stack>
      ) : (
        <Box pt={4} px={1} minHeight="calc(100vh - 64px)">
          <WallSkeleton />
        </Box>
      )}
    </>
  );
}

export function PersonalWallPageMobile() {
  const { data: userWalls, isFetchedAfterMount: isUserWallsFetched } =
    useUserWalls();
  return (
    <>
      {!isUserWallsFetched ? (
        <Box pt={4} px={2} minHeight="calc(100vh - 64px)">
          <WallSkeleton />
        </Box>
      ) : wallsEmpty(userWalls) ? (
        <WallDefaultViewMobile />
      ) : (
        <PersonalWallMobileView userWalls={userWalls} />
      )}
      <BottomNavBar />
    </>
  );
}
