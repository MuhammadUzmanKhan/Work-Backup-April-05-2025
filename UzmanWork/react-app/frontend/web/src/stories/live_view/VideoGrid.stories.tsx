import type { Meta, StoryObj } from "@storybook/react";

import { Stack } from "@mui/material";
import { VideoGrid } from "components/VideoGrid";
import { PaginationNavigator } from "components/devices/PaginationUtils";
import archive_handlers from "mocks/archive_handlers";
import thumbnail_query_handler from "mocks/thumbnail_query_handler";
import { useState } from "react";
import { PLAYER_OPTIONS_NO_INTERACTIONS } from "utils/player_options";
import { randomCameraResponses } from "stories/utils_stories";

const meta: Meta<typeof VideoGrid> = {
  title: "LiveView/VideoGrid",
  component: VideoGrid,
  tags: ["autodocs"],
  parameters: {
    msw: {
      handlers: { ...archive_handlers, ...thumbnail_query_handler },
    },
  },
};

export default meta;
type Story = StoryObj<typeof VideoGrid>;

function VideoGridWrapped(args: Parameters<typeof VideoGrid>[0]) {
  const [page, setPage] = useState(0);
  return (
    <Stack>
      <VideoGrid {...args} />
      <PaginationNavigator
        numItems={args.cameraResponses.length}
        page={page}
        setPage={setPage}
        itemsPerPage={(args.videoPerRow ?? 3) * (args.rowsPerPage ?? 3)}
      />
    </Stack>
  );
}

const CAMERA_RESPONSE = randomCameraResponses(25);

export const WithPagination: Story = {
  args: {
    defaultVideoName: "test-name",
    cameraResponses: CAMERA_RESPONSE,
    page: 0,
    videoPerRow: 3,
    rowsPerPage: 3,
    playerOptions: {
      hideStreamName: true,
      htmlPlayerOptions: PLAYER_OPTIONS_NO_INTERACTIONS,
      isLiveStream: true,
      hideLiveIndicator: false,
      hideTime: true,
    },
  },
  render: (args) => <VideoGridWrapped {...args} />,
};
