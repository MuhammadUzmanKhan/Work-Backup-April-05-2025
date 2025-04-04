import { Meta, StoryObj } from "@storybook/react";
import { LocationRegistrationPopup } from "components/devices/LocationRegistrationPopup";

const meta: Meta<typeof LocationRegistrationPopup> = {
  title: "Devices/PopUp/LocationRegistrationPopup",
  component: LocationRegistrationPopup,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof LocationRegistrationPopup>;

export const Default: Story = {
  args: {
    deviceCode: "12345",
    setLocationOpen: () => null,
    refetchLocations: () => null,
    setLocationUpstream: () => null,
  },
  render: (args) => <LocationRegistrationPopup {...args} />,
};
