import { Meta, StoryObj } from "@storybook/react";
import { TimelineVideoClip } from "components/timeline/TimelineVideoClip";
import { DateTime } from "luxon";
import { randomCameraResponses } from "stories/utils_stories";

const meta: Meta<typeof TimelineVideoClip> = {
  title: "Timeline/TimelineVideoClip",
  component: TimelineVideoClip,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof TimelineVideoClip>;

const CLIP_DATA = {
  startTime: DateTime.fromISO("2021-10-01T00:00:00.000Z"),
  endTime: DateTime.fromISO("2021-10-01T00:00:00.000Z"),
  camera: randomCameraResponses(1)[0],
};

export const Default: Story = {
  args: {
    clip: CLIP_DATA,
    displayDate: true,
    displayCameraName: true,
    hideBottomToolbar: false,
  },
};
