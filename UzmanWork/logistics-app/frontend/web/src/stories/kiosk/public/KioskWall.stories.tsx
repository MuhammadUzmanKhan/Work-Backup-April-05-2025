import type { Meta, StoryObj } from "@storybook/react";
import {
  PublicCameraData,
  VideoResRequestType,
  isDefined,
} from "coram-common-utils";

import { KioskWall } from "components/kiosk/public/KioskWall";
import video_player_handlers from "mocks/video_player_handlers";
import { getTestKioskWallResponse } from "stories/utils_stories";

const meta: Meta<typeof KioskWall> = {
  title: "Kiosk/Public/KioskWall",
  component: KioskWall,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    msw: {
      handlers: video_player_handlers,
    },
  },
};

export default meta;
type Story = StoryObj<typeof KioskWall>;

const WALL_RESPONSE = getTestKioskWallResponse(1);

export const Default: Story = {
  args: {
    kioskHash: "test-kiosk-hash",
    wall: WALL_RESPONSE.wall,
    cameras: WALL_RESPONSE.wall_tiles
      .map((tile) => tile.camera_data)
      .filter((camera): camera is PublicCameraData => isDefined(camera)),
    tiles: WALL_RESPONSE.wall_tiles.map((tile) => tile.wall_tile),
    resolutionConfig: {
      static_resolution: VideoResRequestType.LOW,
    },
  },
};
