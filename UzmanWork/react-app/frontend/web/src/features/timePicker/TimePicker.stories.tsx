import type { Meta, StoryObj } from "@storybook/react";

import { useState } from "react";
import { TimePicker } from "./TimePicker";
import { DateTime } from "luxon";
import { Button, Stack, Typography } from "@mui/material";

const meta: Meta<typeof TimePicker> = {
  title: "Time/TimePicker",
  component: TimePicker,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof TimePicker>;

function TimePickerWrapped(args: Parameters<typeof TimePicker>[0]) {
  const [time, setTime] = useState(DateTime.fromFormat("12:00 PM", "hh:mm a"));
  return (
    <Stack gap={2}>
      <TimePicker {...args} time={time} setTime={setTime} />
      <Button
        variant="contained"
        onClick={() => setTime(DateTime.fromFormat("12:00 PM", "hh:mm a"))}
      >
        Set to 12:00 PM
      </Button>
      <Button
        variant="contained"
        onClick={() => setTime(DateTime.fromFormat("01:00 PM", "hh:mm a"))}
      >
        Set to 01:00 PM
      </Button>

      <Typography>Selected time: {time.toFormat("hh:mm a")}</Typography>
    </Stack>
  );
}

export const Default: Story = {
  args: {},
  render: (args) => <TimePickerWrapped {...args} />,
};
