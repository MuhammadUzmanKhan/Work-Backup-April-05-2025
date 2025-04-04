import { Stack, Button, Box, Typography } from "@mui/material";
import {
  UserWallService,
  UserWallsResponse,
  WallTile,
} from "coram-common-utils";
import { Add as AddIcon } from "@mui/icons-material";
import { WallPageMode } from "pages/PersonalWallPage";
import { WallItem } from "./utils/WallItem";
import { useContext, useMemo } from "react";
import { WallNameDropdown } from "./utils/WallNameDropdown";
import {
  GeneralWallResponse,
  adaptWallTilesToLayout,
  tilesAreFromLayout,
  partitionWalls,
  isWallResponse,
} from "./utils/utils";
import {
  WallLayout,
  WallLayoutSelector,
} from "components/wall/WallLayoutSelector";
import { PlayerSwitch } from "./multi_video_controls/PlayerSwitch";
import { WallSizeSelector } from "./utils/WallSizeSelector";
import { NotificationContext } from "contexts/notification_context";
import { matchApiException } from "utils/error_handling";
import { useAuth0 } from "@auth0/auth0-react";
import { FullScreenButton } from "components/FullScreenButton";
import { confirm } from "utils/confirm";

const WALL_LAYOUTS = [
  WallLayout.TwoByTwo,
  WallLayout.ThreeByThree,
  WallLayout.FourByFour,
  WallLayout.FiveByFive,
  WallLayout.SixBySix,
  WallLayout.ThreeByThreeAsymmetric,
];

interface WallsHeaderProps {
  mode: WallPageMode;
  onWallClick: (wall: GeneralWallResponse) => void;
  onCreateWallClick: VoidFunction;
  onEditWallClick: (wall: GeneralWallResponse) => void;
  onNewWallClickAway: VoidFunction;
  userWalls: UserWallsResponse;
  refetchUserWalls: VoidFunction;
  currentWallId: number | null;
  tiles: WallTile[];
  refetchTiles: VoidFunction;
  onWallRemoved: (removedWallId: number) => void;
  isPlayerVisible: boolean;
  disablePlayerSwitch: boolean;
  onChangePlayerVisibility: (playerVisible: boolean) => void;
  gridWidthPerc: number;
  onGridWidthChange: (newSize: number) => void;
  wallGridContainer: HTMLDivElement | null;
}

export function WallHeader({
  mode,
  onWallClick,
  onCreateWallClick,
  onEditWallClick,
  onNewWallClickAway,
  userWalls,
  refetchUserWalls,
  currentWallId,
  tiles,
  refetchTiles,
  onWallRemoved,
  isPlayerVisible,
  disablePlayerSwitch,
  onChangePlayerVisibility,
  gridWidthPerc,
  onGridWidthChange: setGridWidthPerc,
  wallGridContainer,
}: WallsHeaderProps) {
  // Decide which walls to show in the header and which to show in the dropdown.
  const { visibleWalls, dropdownWalls } = partitionWalls(
    userWalls,
    currentWallId
  );

  // Compute the layout based on the wall tiles.
  const layout = useMemo(() => {
    for (const layout of WALL_LAYOUTS) {
      if (tilesAreFromLayout(tiles, layout)) {
        return layout;
      }
    }
    return WallLayout.Invalid;
  }, [tiles]);

  const { setNotificationData } = useContext(NotificationContext);

  const { user } = useAuth0();

  // Update the tiles of the wall we are editing when the layout changes.
  async function onWallLayoutChange(layout: WallLayout) {
    try {
      if (currentWallId !== null) {
        await UserWallService.editTiles(
          currentWallId,
          adaptWallTilesToLayout(tiles, layout)
        );
        await refetchTiles();
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Wall interactions
  async function onWallRename(wallId: number, newName: string) {
    try {
      await UserWallService.renameWall({
        wall_id: wallId,
        new_wall_name: newName,
      });
    } catch (e) {
      const errorMessage = matchApiException(
        e,
        "Wall name already used for user"
      )
        ? "A wall with this name already exists, cannot rename!"
        : "Failure renaming wall!";
      setNotificationData({
        message: errorMessage,
        severity: "error",
      });
      console.error(e);
    }
    refetchUserWalls();
  }
  async function onWallRemove(wallId: number) {
    onWallRemoved(wallId);
    await UserWallService.deleteWall(wallId);
    refetchUserWalls();
  }
  async function onWallRemoveWithConfirm(wall: GeneralWallResponse) {
    if (!isWallResponse(wall)) {
      await onWallRemove(wall.wall.id);
      return;
    }

    let is_used_in_kiosk = false;
    try {
      is_used_in_kiosk = await UserWallService.isWallUsedInKiosk(wall.wall.id);
    } catch (e) {
      // TODO (VAS-2528): Handle errors everywhere in this file.
      console.error(e);
      return;
    }
    if (is_used_in_kiosk) {
      const isConfirmed = await confirm({
        confirmText:
          "This wall is used in a kiosk. Removing it will remove it from the kiosk.",
        yesText: "Yes, remove the wall from the kiosk",
        noText: "No, keep the wall in the kiosk",
      });
      if (!isConfirmed) {
        return;
      }
    }

    await onWallRemove(wall.wall.id);
  }
  async function onWallShare(
    wall: GeneralWallResponse,
    shareWithEmails: string[]
  ) {
    await UserWallService.copyWall({
      original_wall_id: wall.wall.id,
      shared_with_user_emails: shareWithEmails,
      wall_name: wall.wall.name,
      sender_email: user?.email,
    });
  }

  return (
    <Box marginBottom={3}>
      <Stack direction="row" gap={2} alignItems="start">
        <Stack
          direction="row"
          columnGap={2}
          rowGap={0.5}
          alignItems="center"
          flexWrap="wrap"
        >
          {visibleWalls.map((wall) => (
            <WallItem
              key={wall.wall.id}
              wallName={wall.wall.name}
              onWallRename={(newName: string) =>
                onWallRename(wall.wall.id, newName)
              }
              onWallClick={(setIsEditing) => {
                if (mode === WallPageMode.NEW_WALL) {
                  // If we are in new wall mode and the user clicks on the new wall itself,
                  // start editing the name.
                  if (wall.wall.id === currentWallId) {
                    setIsEditing(true);
                  } else {
                    // Otherwise we clicked on another wall without saving the new wall.
                    onNewWallClickAway();
                    onWallClick(wall);
                  }
                } else {
                  onWallClick(wall);
                }
              }}
              onWallEdit={() => onEditWallClick(wall)}
              onWallRemove={async () => await onWallRemoveWithConfirm(wall)}
              onWallShare={async (shareWithEmail) =>
                await onWallShare(wall, shareWithEmail)
              }
              isSelected={wall.wall.id === currentWallId}
            />
          ))}
          {dropdownWalls.length > 0 && (
            <WallNameDropdown
              dropdownWalls={dropdownWalls}
              onWallItemClick={onWallClick}
            />
          )}
        </Stack>

        <Stack direction="row" marginLeft="auto" alignItems="center" gap={1.5}>
          <PlayerSwitch
            checked={isPlayerVisible}
            onChange={onChangePlayerVisibility}
            disabled={disablePlayerSwitch}
          />
          {mode !== WallPageMode.NEW_WALL && (
            <WallSizeSelector
              minValue={30}
              maxValue={100}
              step={10}
              value={gridWidthPerc}
              onChange={setGridWidthPerc}
            />
          )}
          <FullScreenButton targetElement={wallGridContainer} />
          {mode === WallPageMode.SHOW && (
            <Button
              style={{
                flexShrink: 0,
                borderRadius: "8px",
              }}
              color="secondary"
              variant="contained"
              onClick={onCreateWallClick}
            >
              <AddIcon fontSize="small" />
              <Typography variant="body2"> New Wall</Typography>
            </Button>
          )}
          {(mode === WallPageMode.EDIT_WALL ||
            mode === WallPageMode.NEW_WALL) && (
            <Box>
              <WallLayoutSelector
                layout={layout}
                onLayoutChange={onWallLayoutChange}
                availableLayouts={WALL_LAYOUTS}
              />
            </Box>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
