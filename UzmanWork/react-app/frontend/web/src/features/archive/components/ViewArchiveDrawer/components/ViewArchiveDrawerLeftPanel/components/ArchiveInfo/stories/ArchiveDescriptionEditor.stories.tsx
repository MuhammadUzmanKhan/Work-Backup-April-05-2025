import type { Meta, StoryObj } from "@storybook/react";
import { ArchiveDescriptionEditor } from "../components";

const meta: Meta<typeof ArchiveDescriptionEditor> = {
  title: "Archive/ViewArchiveDrawer/ArchiveDescriptionEditor",
  component: ArchiveDescriptionEditor,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ArchiveDescriptionEditor>;

export const Default: Story = {
  args: {
    description: "this is the initial description we can edit in this box",
    onDescriptionChange: async (description: string) => {
      window.alert(`description submitted: ${description}`);
    },
  },
};
