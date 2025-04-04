import type { Meta, StoryObj } from "@storybook/react";
import { VideoTopBar } from "components/video/VideoTopBar";
import { DateTime } from "luxon";

const meta: Meta<typeof VideoTopBar> = {
  title: "VideoPlayer/TopBar",
  component: VideoTopBar,
  tags: ["autodocs"],
};

const VIDEO_NAME = "test-video-name";

export default meta;
type Story = StoryObj<typeof VideoTopBar>;

export const NoTimeInfo: Story = {
  args: {
    videoName: VIDEO_NAME,
  },
};

export const TimeInfoNotShown: Story = {
  args: {
    ...NoTimeInfo.args,
    videoTimeInfo: {
      streamTime: DateTime.now(),
      isTrackingLive: true,
      hideTime: true,
    },
  },
};

export const TimeInfoNotShownNotTracking: Story = {
  args: {
    ...NoTimeInfo.args,
    videoTimeInfo: {
      streamTime: DateTime.now(),
      isTrackingLive: false,
      hideTime: true,
    },
  },
};

export const TimeInfoShownTracking: Story = {
  args: {
    ...NoTimeInfo.args,
    videoTimeInfo: {
      streamTime: DateTime.now(),
      isTrackingLive: true,
      hideTime: false,
    },
  },
};

export const TimeInfoShownNotTracking: Story = {
  args: {
    ...NoTimeInfo.args,
    videoTimeInfo: {
      streamTime: DateTime.now(),
      isTrackingLive: false,
      hideTime: false,
    },
  },
};
