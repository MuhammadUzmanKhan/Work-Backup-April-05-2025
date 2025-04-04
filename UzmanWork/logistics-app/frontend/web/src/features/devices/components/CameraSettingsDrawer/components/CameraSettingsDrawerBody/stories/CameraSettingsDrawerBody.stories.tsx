import Grid from "@mui/material/Unstable_Grid2";
import { Meta, StoryObj } from "@storybook/react";
import {
  generateRefetchStreamsStub,
  randomCameraResponses,
} from "stories/utils_stories";
import { CameraSettingsDrawerBody } from "../CameraSettingsDrawerBody";

const meta: Meta<typeof CameraSettingsDrawerBody> = {
  title: "Devices/CamerasTable/CameraSettingsDrawer/CameraSettingsDrawerBody",
  component: CameraSettingsDrawerBody,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};
export default meta;

const CAMERA_RESPONSE = randomCameraResponses(1)[0];

type Story = StoryObj<typeof CameraSettingsDrawerBody>;

export const Default: Story = {
  args: {
    camera: CAMERA_RESPONSE,
    refetchCameras: generateRefetchStreamsStub(),
  },
  render: (args) => (
    <Grid container minWidth="75vw">
      <CameraSettingsDrawerBody {...args} />
    </Grid>
  ),
};
