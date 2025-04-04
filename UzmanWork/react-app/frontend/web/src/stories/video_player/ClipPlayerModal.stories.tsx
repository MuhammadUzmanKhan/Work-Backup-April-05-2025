import type { Meta, StoryObj } from "@storybook/react";
import {
  VideoResRequestType,
  getDynamicResolutionConfig,
} from "coram-common-utils";
import { ClipPlayerModal } from "components/timeline/ClipPlayerModal";
import video_player_handlers from "mocks/video_player_handlers";
import { randomCameraResponses } from "stories/utils_stories";

const meta: Meta<typeof ClipPlayerModal> = {
  title: "VideoPlayer/ClipPlayerModal",
  component: ClipPlayerModal,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    msw: {
      handlers: video_player_handlers,
    },
  },
};

export default meta;
type Story = StoryObj<typeof ClipPlayerModal>;

const CAMERA_RESPONSE = randomCameraResponses(1)[0];

export const Opened: Story = {
  args: {
    videoName: "test-video-name",
    open: true,
    onClose: () => null,

    currentStream: CAMERA_RESPONSE,
    kinesisOption: {
      requestType: "clip",
      mac_address: "test-mac-address",
      start_time: "2021-10-01T00:00:00.000Z",
      end_time: "2021-10-01T00:00:00.000Z",
      resolution_config: getDynamicResolutionConfig(VideoResRequestType.HIGH),
    },
    onArchiveClick: () => null,
    onDownloadClick: async () => null,
    onShareVideoClick: () => null,
    onVideoEnded: () => null,
  },
};
