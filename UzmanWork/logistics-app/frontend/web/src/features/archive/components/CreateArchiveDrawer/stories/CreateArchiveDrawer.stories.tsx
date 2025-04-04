import { Button } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { rest } from "msw";

import { CreateArchiveDrawer } from "../CreateArchiveDrawer";
import archive_handlers from "mocks/archive_handlers";
import thumbnail_query_handler from "mocks/thumbnail_query_handler";
import { useState } from "react";
import { DateTime } from "luxon";
import { randomCameraResponses } from "stories/utils_stories";

const BASE = "http://msw";

const CAMERA_RESPONSE = randomCameraResponses(1)[0];

const meta: Meta<typeof CreateArchiveDrawer> = {
  title: "Archive/CreateArchiveDrawer",
  component: CreateArchiveDrawer,
  tags: ["autodocs"],
  parameters: {
    msw: {
      handlers: { ...archive_handlers, ...thumbnail_query_handler },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CreateArchiveDrawer>;

function WrappedArchiveCreateDialog(
  args: Parameters<typeof CreateArchiveDrawer>[0]
) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
        }}
        variant="contained"
      >
        Show Dialog
      </Button>
      <CreateArchiveDrawer
        {...args}
        onClose={() => setOpen(false)}
        open={open}
      />
    </>
  );
}

export const Default: Story = {
  args: {
    clipTimeInterval: {
      timeStart: DateTime.now().minus({ minutes: 1 }),
      timeEnd: DateTime.now(),
    },
    cameraResponse: CAMERA_RESPONSE,
  },

  render: (args) => <WrappedArchiveCreateDialog {...args} />,
};

export const NoExistingArchives: Story = {
  args: Default.args,
  parameters: {
    msw: {
      handlers: {
        ...archive_handlers,
        ...thumbnail_query_handler,
        summary: [
          rest.get(BASE + "/archive/summary", async (req, res, ctx) => {
            return res(ctx.json([]));
          }),
        ],
      },
    },
  },
  render: (args) => <WrappedArchiveCreateDialog {...args} />,
};
