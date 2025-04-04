import type { Meta, StoryObj } from "@storybook/react";
import { RegistrationDetails } from "../components/RegistrationDetails";
import { randomCameraCandidatesData } from "stories/utils_stories";

const meta: Meta<typeof RegistrationDetails> = {
  title: "Camera Registration/CameraRegistrationDetails",
  component: RegistrationDetails,
  tags: ["autodocs"],
};

const CANDIDATES_DATA = randomCameraCandidatesData(15);

export default meta;
type Story = StoryObj<typeof RegistrationDetails>;

export const ShowDetails: Story = {
  args: {
    numCandidates: CANDIDATES_DATA.length,
    onSubmit: (credentials) =>
      alert(`Submitted credentials: ${JSON.stringify(credentials)}`),
  },
};
