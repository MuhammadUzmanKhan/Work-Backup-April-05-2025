import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { TrackImage } from "components/timeline/journey/TrackImage";

const meta: Meta<typeof TrackImage> = {
  title: "Journey/TrackImage",
  component: TrackImage,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof TrackImage>;

export const WiderThanTaller: Story = {
  args: {
    imageUrl: "https://via.placeholder.com/300x100",
  },
  render: (args) => (
    <Box border="1px solid red">
      <TrackImage {...args} />
    </Box>
  ),
};

export const TallerThanWider: Story = {
  args: {
    imageUrl: "https://via.placeholder.com/100x300",
  },
  render: WiderThanTaller.render,
};

export const Square: Story = {
  args: {
    imageUrl: "https://via.placeholder.com/300x300",
  },
  render: WiderThanTaller.render,
};
