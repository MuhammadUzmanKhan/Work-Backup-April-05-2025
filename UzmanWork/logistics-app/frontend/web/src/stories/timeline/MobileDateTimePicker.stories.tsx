import type { Meta, StoryObj } from "@storybook/react";
import { MobileDateTimePicker } from "components/timeline/mobile_date_picker/MobileDateTimePicker";
import { DateTime } from "luxon";
import { useState } from "react";

const meta: Meta<typeof MobileDateTimePicker> = {
  title: "Timeline/MobileDateTimePicker",
  component: MobileDateTimePicker,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof MobileDateTimePicker>;

const MobileDateTimePickerWithSetter = (
  args: Parameters<typeof MobileDateTimePicker>[0]
) => {
  const [open, setOpen] = useState(true);
  // Sets the hooks for both the label and primary props
  const [value, setValue] = useState(DateTime.now());
  return (
    <MobileDateTimePicker
      {...args}
      open={open}
      currDate={value}
      onDateTimeChange={(_, date) => setValue(date)}
      onClose={() => setOpen(false)}
    />
  );
};

export const Default: Story = {
  args: {
    open: true,
    currDate: DateTime.now(),
    currTime: DateTime.invalid("Invalid time").toFormat("hh:mm:ss a"),
    timezone: "America/New_York",
    onDateTimeChange: () => null,
    onClose: () => null,
  },
  render: (args) => <MobileDateTimePickerWithSetter {...args} />,
};
