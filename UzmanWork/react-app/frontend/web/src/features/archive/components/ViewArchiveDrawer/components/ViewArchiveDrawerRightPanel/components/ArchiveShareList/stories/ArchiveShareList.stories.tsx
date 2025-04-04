import type { Meta, StoryObj } from "@storybook/react";

import { ArchiveShareList } from "../ArchiveShareList";

const meta: Meta<typeof ArchiveShareList> = {
  title: "Archive/ViewArchiveDrawer/ArchiveShareList",
  component: ArchiveShareList,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ArchiveShareList>;

export const WithEmails: Story = {
  args: {
    sharingEmails: ["test@test.com", "anotherTest@test.com"],
  },
};

export const WithoutEmails: Story = {
  args: {
    sharingEmails: [],
  },
};
