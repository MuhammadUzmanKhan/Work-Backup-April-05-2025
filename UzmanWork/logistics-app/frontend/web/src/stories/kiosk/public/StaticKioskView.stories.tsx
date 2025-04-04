import type { Meta, StoryObj } from "@storybook/react";
import { VideoResRequestType } from "coram-common-utils";

import { StaticKioskView } from "components/kiosk/public/StaticKioskView";
import video_player_handlers from "mocks/video_player_handlers";
import { getTestKioskWallResponse } from "stories/utils_stories";

const meta: Meta<typeof StaticKioskView> = {
  title: "Kiosk/Public/StaticKioskView",
  component: StaticKioskView,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    msw: {
      handlers: video_player_handlers,
    },
  },
};

export default meta;
type Story = StoryObj<typeof StaticKioskView>;

export const Default: Story = {
  args: {
    kioskName: "test-kiosk-name",
    kioskHash: "test-kiosk-hash",
    wall: getTestKioskWallResponse(0),
    resolutionConfig: {
      static_resolution: VideoResRequestType.LOW,
    },
  },
};
