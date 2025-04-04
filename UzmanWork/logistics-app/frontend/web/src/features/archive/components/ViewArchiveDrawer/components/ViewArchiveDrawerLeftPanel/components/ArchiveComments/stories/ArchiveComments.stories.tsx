import type { Meta, StoryObj } from "@storybook/react";
import { ArchiveComments } from "../ArchiveComments";
import { apiMocks } from "./apiMocks";
import { ARCHIVE_ID } from "./consts";

const meta: Meta<typeof ArchiveComments> = {
  title: "Archive/ViewArchiveDrawer/ArchiveComments",
  component: ArchiveComments,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    msw: {
      handlers: { ...apiMocks },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ArchiveComments>;

export const Default: Story = {
  args: {
    archiveId: ARCHIVE_ID,
    onClipClick: () => null,
  },
};
