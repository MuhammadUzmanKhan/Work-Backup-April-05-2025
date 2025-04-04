import type { Meta, StoryObj } from "@storybook/react";
import { Location } from "coram-common-utils";
import { Controls } from "../components/Controls";
import { useState } from "react";
import { randomLocations } from "stories/utils_stories";

const meta: Meta<typeof Controls> = {
  title: "Camera Registration/CameraRegistrationControls",
  component: Controls,
  tags: ["autodocs"],
};

const LOCATIONS = randomLocations(10);

export default meta;
type Story = StoryObj<typeof Controls>;

function WrappedCameraRegistrationControls() {
  const [selectedLocation, setSelectedLocation] = useState<Location>();
  const [searchQuery, setSearchQuery] = useState<string>("");

  return (
    <Controls
      locations={LOCATIONS}
      selectedLocation={selectedLocation}
      setSelectedLocation={setSelectedLocation}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
    />
  );
}

export const Interactions: Story = {
  render: WrappedCameraRegistrationControls,
};
