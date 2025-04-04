import { Meta, StoryObj } from "@storybook/react";
import { DeviceRegistrationPopup } from "components/devices/DeviceRegistrationPopup";

const meta: Meta<typeof DeviceRegistrationPopup> = {
  title: "Devices/PopUp/DeviceRegistrationPopup",
  component: DeviceRegistrationPopup,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof DeviceRegistrationPopup>;

export const Default: Story = {
  args: {
    setRegistrationOpen: () => null,
    onRegistrationSuccess: () => null,
  },
  render: (args) => <DeviceRegistrationPopup {...args} />,
};
