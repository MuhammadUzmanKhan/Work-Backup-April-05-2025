import { Button } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { ViewArchiveDrawer } from "../ViewArchiveDrawer";

import { useState } from "react";

import archive_handlers from "mocks/archive_handlers";
import thumbnail_query_handler from "mocks/thumbnail_query_handler";
import { ArchiveResponse } from "utils/archives_types";
import { ARCHIVE, ARCHIVE_WITH_NO_COMMENTS } from "./consts";

const meta: Meta<typeof ViewArchiveDrawer> = {
  title: "Archive/ViewArchiveDrawer/ViewArchiveDrawer",
  component: ViewArchiveDrawer,
  tags: ["autodocs"],
  parameters: {
    msw: {
      handlers: { ...archive_handlers, ...thumbnail_query_handler },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ViewArchiveDrawer>;

function WrappedDrawer(args: Parameters<typeof ViewArchiveDrawer>[0]) {
  const [selectedArchive, setSelectedArchive] = useState<ArchiveResponse>();

  return (
    <>
      <Button
        onClick={() => setSelectedArchive(args.archive)}
        variant="contained"
      >
        Show Drawer
      </Button>
      <ViewArchiveDrawer
        {...args}
        archive={selectedArchive}
        onClose={() => setSelectedArchive(undefined)}
        refetchArchives={async () => Promise.resolve()}
      />
    </>
  );
}

export const Default: Story = {
  args: {
    archive: ARCHIVE,
    allowEdit: true,
  },
  render: (args) => <WrappedDrawer {...args} />,
};

export const NoInteractions: Story = {
  args: {
    ...Default.args,
    allowEdit: false,
  },
  render: (args) => <WrappedDrawer {...args} />,
};

export const NoComments: Story = {
  args: {
    archive: ARCHIVE_WITH_NO_COMMENTS,
    allowEdit: false,
  },
  render: (args) => <WrappedDrawer {...args} />,
};
