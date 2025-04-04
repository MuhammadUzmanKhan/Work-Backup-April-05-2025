import type { Meta, StoryObj } from "@storybook/react";
import { Footer } from "../components/Footer";
import { randomCameraCandidatesData } from "stories/utils_stories";

const meta: Meta<typeof Footer> = {
  title: "Camera Registration/CameraRegistrationFooter",
  component: Footer,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Footer>;

export const NoSelected: Story = {
  args: {
    isRegistrationInProgress: false,
    candidateCameras: [],
  },
};

const CANDIDATES = randomCameraCandidatesData(10).map((cd) => ({
  data: cd,
  selected: true,
  idx: 0,
}));
export const Selected: Story = {
  args: {
    isRegistrationInProgress: false,
    candidateCameras: CANDIDATES,
    disabled: false,
    numTotalSlots: 15,
  },
};

export const Loading: Story = {
  args: {
    isRegistrationInProgress: true,
    candidateCameras: [],
    disabled: false,
    numTotalSlots: 15,
  },
};

export const TooManyCameras: Story = {
  args: {
    isRegistrationInProgress: false,
    candidateCameras: CANDIDATES,
    disabled: false,
    numTotalSlots: 5,
  },
};
