import type { Meta, StoryObj } from "@storybook/react";
import { KioskNextWallRequest, VideoResRequestType } from "coram-common-utils";

import { RotatingKioskView } from "components/kiosk/public/RotatingKioskView";
import video_player_handlers from "mocks/video_player_handlers";
import { getTestKioskWallResponse } from "stories/utils_stories";

const meta: Meta<typeof RotatingKioskView> = {
  title: "Kiosk/Public/RotatingKioskView",
  component: RotatingKioskView,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    msw: {
      handlers: video_player_handlers,
    },
  },
};

export default meta;
type Story = StoryObj<typeof RotatingKioskView>;

export const Default: Story = {
  args: {
    kioskName: "test-kiosk-name",
    kioskHash: "test-kiosk-hash",
    rotationFrequencyS: 10,
    firstWall: getTestKioskWallResponse(0),
    resolutionConfig: {
      static_resolution: VideoResRequestType.LOW,
    },
    onPublicKioskNextWall: async (
      kioskHash: string,
      request: KioskNextWallRequest
    ) => {
      // We assume that idx is the same as the current_wall_id. This way we can
      // switch back and forth between walls.
      if (
        request.current_wall_id === undefined ||
        request.current_wall_id === 1
      ) {
        return getTestKioskWallResponse(0);
      } else {
        return getTestKioskWallResponse(1);
      }
    },
  },
};
