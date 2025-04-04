import type { Meta, StoryObj } from "@storybook/react";

import { StaticKioskChip } from "components/kiosk/public/KioskChip";

const meta: Meta<typeof StaticKioskChip> = {
  title: "Kiosk/Public/StaticKioskChip",
  component: StaticKioskChip,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof StaticKioskChip>;

export const Default: Story = {
  args: {
    kioskName: "Kiosk Name",
    currentWallName: "Wall Name",
  },
};
