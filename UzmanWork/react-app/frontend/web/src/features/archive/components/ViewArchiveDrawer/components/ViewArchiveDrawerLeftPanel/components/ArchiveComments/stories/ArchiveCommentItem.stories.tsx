import type { Meta, StoryObj } from "@storybook/react";
import { ArchiveCommentItem } from "../components";
import { COMMENTS } from "./consts";

const meta: Meta<typeof ArchiveCommentItem> = {
  title: "Archive/ViewArchiveDrawer/ArchiveComments/ArchiveCommentItem",
  component: ArchiveCommentItem,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ArchiveCommentItem>;

export const Default: Story = {
  args: {
    comment: COMMENTS[0],
    onClipClick: () => null,
  },
};
