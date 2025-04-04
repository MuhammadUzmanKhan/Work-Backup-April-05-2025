import type { Meta, StoryObj } from "@storybook/react";
import { UserWallsResponse } from "coram-common-utils";
import { WallHeader } from "components/personal_wall/WallHeader";
import { generateTilesInSquareGrid } from "components/personal_wall/utils/utils";
import { WallPageMode } from "pages/PersonalWallPage";

const meta: Meta<typeof WallHeader> = {
  title: "PersonalWall/WallHeader/WallHeader",
  component: WallHeader,
  tags: ["autodocs"],
};

const WALL_RESPONSE: UserWallsResponse = {
  walls: [
    {
      wall: {
        owner_user_email: "test@test.com",
        name: "I'm a wall",
        id: 0,
      },
      share_infos: [],
    },
    {
      wall: {
        owner_user_email: "test@test.com",
        name: "I'm another wall",
        id: 1,
      },
      share_infos: [],
    },
  ],
  shared_walls: [],
};

export default meta;
type Story = StoryObj<typeof WallHeader>;

export const ShowMode: Story = {
  args: {
    mode: WallPageMode.SHOW,
    onWallClick: () => alert("onWallClick"),
    onCreateWallClick: () => alert("onCreateWallClick"),
    onEditWallClick: () => alert("onEditWallClick"),
    userWalls: WALL_RESPONSE,
    refetchUserWalls: () => null,
    currentWallId: 0,
    tiles: generateTilesInSquareGrid(3),
    refetchTiles: () => null,
    onWallRemoved: () => alert("onWallRemoved"),
    isPlayerVisible: false,
    disablePlayerSwitch: false,
    onChangePlayerVisibility: () => alert("onChangePlayerVisibility"),
  },
};

export const EditMode: Story = {
  args: {
    ...ShowMode.args,
    mode: WallPageMode.EDIT_WALL,
  },
};

export const NewMode: Story = {
  args: {
    ...ShowMode.args,
    mode: WallPageMode.NEW_WALL,
  },
};

export const PlayerDisabled: Story = {
  args: {
    ...ShowMode.args,
    disablePlayerSwitch: true,
  },
};
