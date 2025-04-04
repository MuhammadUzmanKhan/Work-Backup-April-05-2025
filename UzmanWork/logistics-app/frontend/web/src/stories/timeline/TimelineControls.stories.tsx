import type { Meta, StoryObj } from "@storybook/react";
import { TimelineControls } from "components/timeline/TimelineControls";
import { DateTime } from "luxon";
import { useState } from "react";

const meta: Meta<typeof TimelineControls> = {
  title: "Timeline/TimelineControls",
  component: TimelineControls,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof TimelineControls>;

const TimelineControlsWithSetter = (
  args: Parameters<typeof TimelineControls>[0]
) => {
  const [value, setValue] = useState(DateTime.now());
  return (
    <TimelineControls {...args} videoTime={value} onTimeChange={setValue} />
  );
};

export const Default: Story = {
  args: {
    timezone: "America/New_York",
  },
  render: (args) => <TimelineControlsWithSetter {...args} />,
};

export const InvalidTime: Story = {
  args: {
    videoTime: DateTime.invalid("Invalid time"),
    timezone: "America/New_York",
  },
};
