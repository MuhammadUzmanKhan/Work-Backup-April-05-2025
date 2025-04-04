import type { Meta, StoryObj } from "@storybook/react";
import { ProgressSlider } from "components/common/ProgressSlider";

const meta: Meta<typeof ProgressSlider> = {
  title: "Common/ProgressSlider",
  component: ProgressSlider,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

const MAX_VIDEO_LENGTH_MARKS = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 5, label: "5" },
  { value: 10, label: "10 min" },
];

export default meta;
type Story = StoryObj<typeof ProgressSlider>;

export const DefaultProgressSlider: Story = {
  args: {
    name: "Clip Length",
    onProgressChange: () => null,
  },
  render: (args) => (
    <ProgressSlider
      {...args}
      marks={MAX_VIDEO_LENGTH_MARKS}
      min={1}
      max={10}
      sx={{
        minWidth: "200px",
        minHeight: "2.75rem",
        p: 0,
        m: 0,
      }}
    />
  ),
};
