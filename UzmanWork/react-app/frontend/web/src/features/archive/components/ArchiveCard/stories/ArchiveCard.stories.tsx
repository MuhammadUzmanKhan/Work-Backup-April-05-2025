import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { ArchiveCard } from "../ArchiveCard";
import archive_handlers from "mocks/archive_handlers";
import thumbnail_query_handler from "mocks/thumbnail_query_handler";
import { ARCHIVE, ARCHIVE_THUMBNAIL } from "./consts";

const meta: Meta<typeof ArchiveCard> = {
  title: "Archive/ArchiveCard",
  component: ArchiveCard,
  tags: ["autodocs"],
  parameters: {
    msw: {
      handlers: { ...archive_handlers, ...thumbnail_query_handler },
    },
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ArchiveCard>;

export const SimpleCard: Story = {
  args: {
    archive: ARCHIVE,
    thumbnail: ARCHIVE_THUMBNAIL,
  },
  render: (args) => (
    <Box maxWidth="400px">
      <ArchiveCard {...args} />
    </Box>
  ),
};
