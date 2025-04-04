import { Meta, StoryObj } from "@storybook/react";
import { Paper, Stack } from "@mui/material";
import { CameraSettingsDrawerHeader } from "../CameraSettingsDrawerHeader";
import { generateRandomCameraWithOnlineStatus } from "stories/utils_stories";

const meta: Meta<typeof CameraSettingsDrawerHeader> = {
  title: "Devices/CamerasTable/CameraSettingsDrawer/CameraSettingsDrawerHeader",
  component: CameraSettingsDrawerHeader,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof CameraSettingsDrawerHeader>;

export const Default: Story = {
  args: {
    camera: generateRandomCameraWithOnlineStatus(1),
    thumbnail: {
      s3_signed_url: "https://via.placeholder.com/200x150",
      timestamp: "",
      s3_path: "",
    },
  },
  render: (args) => (
    <Stack component={Paper} minWidth="75vw" p={2}>
      <CameraSettingsDrawerHeader {...args} />
    </Stack>
  ),
};
