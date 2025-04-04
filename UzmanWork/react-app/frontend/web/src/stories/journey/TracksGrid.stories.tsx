import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { TracksGrid } from "components/timeline/journey/TracksGrid";
import { generateTracks } from "mocks/journey_handlers";
import {
  TrackThumbnailResponseWithJSDate,
  convertTrackThumbnailResponse,
} from "utils/journey_types";

const meta: Meta<typeof TracksGrid> = {
  title: "Journey/TracksGrid",
  component: TracksGrid,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof TracksGrid>;

const TRACKS: TrackThumbnailResponseWithJSDate[] = generateTracks().map(
  (track) => convertTrackThumbnailResponse(track)
);

export const Grid: Story = {
  args: {
    tracks: TRACKS,
    onClick: (track) => alert(JSON.stringify(track)),
  },
  render: (args) => (
    <Box width="70vw" border="1px solid red">
      <TracksGrid {...args} />
    </Box>
  ),
};

export const EmptyGrid: Story = {
  args: {
    tracks: [],
    onClick: (track) => alert(JSON.stringify(track)),
  },
  render: Grid.render,
};
