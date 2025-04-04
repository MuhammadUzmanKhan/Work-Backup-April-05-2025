import type { Meta, StoryObj } from "@storybook/react";

import { ArchiveNewCommentEditor } from "../components";

const meta: Meta<typeof ArchiveNewCommentEditor> = {
  title: "Archive/ViewArchiveDrawer/ArchiveNewCommentEditor",
  component: ArchiveNewCommentEditor,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ArchiveNewCommentEditor>;

export const Default: Story = {
  args: {
    onCreateComment: (comment: string) => {
      window.alert(`comment submitted: ${comment}`);
      return Promise.resolve(true);
    },
  },
};
