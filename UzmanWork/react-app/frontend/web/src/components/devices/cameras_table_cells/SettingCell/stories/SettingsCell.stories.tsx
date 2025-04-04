import type { Meta, StoryObj } from "@storybook/react";
import streams_table_handlers from "mocks/streams_table_handlers";
import {
  generateRefetchStreamsStub,
  randomCameraResponses,
} from "stories/utils_stories";
import { CameraResponse } from "coram-common-utils";
import { SettingsCell } from "../SettingsCell";

const meta: Meta<typeof SettingsCell> = {
  title: "Devices/CamerasTable/SettingsCell",
  component: SettingsCell,
  tags: ["autodocs"],
  parameters: {
    msw: {
      handlers: streams_table_handlers,
    },
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof SettingsCell>;

const CAMERA_RESPONSE = randomCameraResponses(1)[0];

export const Default: Story = {
  args: {
    stream: CAMERA_RESPONSE,
    thumbnail: undefined,
    refetchCameras: generateRefetchStreamsStub<CameraResponse[]>(),
  },
  render: (args) => <SettingsCell {...args} />,
};
