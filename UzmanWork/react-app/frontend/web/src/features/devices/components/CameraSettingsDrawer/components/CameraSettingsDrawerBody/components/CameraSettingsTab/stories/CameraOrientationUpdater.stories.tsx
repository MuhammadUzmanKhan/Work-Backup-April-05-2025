import type { Meta, StoryObj } from "@storybook/react";
import { VideoOrientationType } from "coram-common-utils";
import { camera_orientation_updater_handlers_factory } from "mocks/streams_table_handlers";
import { CameraOrientationUpdater } from "../components";

const meta: Meta<typeof CameraOrientationUpdater> = {
  title: "Devices/CamerasTable/CameraOrientationUpdater",
  component: CameraOrientationUpdater,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    msw: {
      handlers: camera_orientation_updater_handlers_factory(true),
    },
  },
};

export default meta;
type Story = StoryObj<typeof CameraOrientationUpdater>;

export const Interactions: Story = {
  args: {
    macAddress: "00:00:00:00:00:00",
    videoOrientationType: VideoOrientationType.ORIENTATION_IDENTITY,
    onSuccessfulUpdate: () => alert("Updated!"),
  },
  render: (args) => <CameraOrientationUpdater {...args} />,
};

export const UpdateFails: Story = {
  parameters: {
    ...meta.parameters,
    msw: {
      handlers: camera_orientation_updater_handlers_factory(false),
    },
  },
  args: Interactions.args,
  render: Interactions.render,
};

export const CustomStackStyle: Story = {
  args: {
    ...Interactions.args,
    stackProps: {
      gap: 2,
      direction: "column",
    },
  },
  render: Interactions.render,
};
