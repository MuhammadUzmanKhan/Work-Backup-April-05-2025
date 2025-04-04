import type { Meta, StoryObj } from "@storybook/react";
import { CamerasTableLabel } from "components/devices/CamerasTableLabel";
import streams_table_handlers from "mocks/streams_table_handlers";
import { randomCameraResponses } from "stories/utils_stories";

const meta: Meta<typeof CamerasTableLabel> = {
  title: "Devices/CamerasTable/CamerasTableLabel",
  component: CamerasTableLabel,
  tags: ["autodocs"],
  parameters: {
    msw: {
      handlers: streams_table_handlers,
    },
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof CamerasTableLabel>;

const CAMERA_RESPONSES = randomCameraResponses(2);

export const Default: Story = {
  args: {
    streams: CAMERA_RESPONSES,
    onCamerasClick: () => alert("Name clicked"),
    onActiveCamerasClick: () => alert("Online clicked"),
    onOfflineCamerasClick: () => alert("Offline clicked"),
  },
};
