import type { Meta, StoryObj } from "@storybook/react";
import { UpdateCameraGroup } from "components/devices/cameras_table_cells/UpdateCameraGroup";
import streams_table_handlers from "mocks/streams_table_handlers";
import { randomCameraResponses } from "stories/utils_stories";

const meta: Meta<typeof UpdateCameraGroup> = {
  title: "Devices/CamerasTable/UpdateCameraGroup",
  component: UpdateCameraGroup,
  tags: ["autodocs"],
  parameters: {
    msw: {
      handlers: streams_table_handlers,
    },
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof UpdateCameraGroup>;

const CAMERA_RESPONSE = randomCameraResponses(1)[0];

export const Default: Story = {
  args: {
    camera: CAMERA_RESPONSE,
    refetch: () => null,
  },
};
