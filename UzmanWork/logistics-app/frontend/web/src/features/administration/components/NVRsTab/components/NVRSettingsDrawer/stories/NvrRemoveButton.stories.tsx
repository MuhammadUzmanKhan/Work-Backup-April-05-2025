import type { Meta, StoryObj } from "@storybook/react";

import { NvrRemoveButton } from "../components";

const meta: Meta<typeof NvrRemoveButton> = {
  title: "devices/NVRDetailsDrawer/AdminOnlyNVRSettings/NvrRemoveButton",
  component: NvrRemoveButton,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof NvrRemoveButton>;

export const Default: Story = {
  args: {
    nvrUuid: "nvrUuid",
  },
};
