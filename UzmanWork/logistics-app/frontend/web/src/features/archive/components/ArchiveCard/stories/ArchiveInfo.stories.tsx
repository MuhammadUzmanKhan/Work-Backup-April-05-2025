import type { Meta, StoryObj } from "@storybook/react";
import { ArchiveInfo } from "../ArchiveInfo";
import { ARCHIVE } from "./consts";

const meta: Meta<typeof ArchiveInfo> = {
  title: "Archive/ArchiveCard/ArchiveInfo",
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
    archiveId: ARCHIVE.id,
    creatorEmail: ARCHIVE.owner_user_email,
    creationDate: ARCHIVE.creation_time,
    description: ARCHIVE.description,
    tags: ARCHIVE.tags,
  },
  render: (args) => <ArchiveInfo {...args} />,
};
