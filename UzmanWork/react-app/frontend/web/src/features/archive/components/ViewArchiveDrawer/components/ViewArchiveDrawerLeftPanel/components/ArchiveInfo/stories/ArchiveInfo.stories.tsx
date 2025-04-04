import type { Meta, StoryObj } from "@storybook/react";
import { ArchiveInfo } from "../ArchiveInfo";

const meta: Meta<typeof ArchiveInfo> = {
  title: "Archive/ViewArchiveDrawer/ArchiveInfo",
  component: ArchiveInfo,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ArchiveInfo>;

export const Default: Story = {
  args: {
    title: "this is the tile",
    description: "this is the initial description we can edit in this box",
  },
  render: (args) => <ArchiveInfo {...args} />,
};
