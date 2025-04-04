import type { Meta, StoryObj } from "@storybook/react";

import { RotatingKioskChip } from "components/kiosk/public/KioskChip";

const meta: Meta<typeof RotatingKioskChip> = {
  title: "Kiosk/Public/RotatingKioskChip",
  component: RotatingKioskChip,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof RotatingKioskChip>;

export const Default: Story = {
  args: {
    kioskName: "Kiosk Name",
    currentWallName: "Wall Name",
    timeLeftS: 5,
  },
};
