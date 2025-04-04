import type { Meta, StoryObj } from "@storybook/react";
import { CustomDateTimePicker } from "components/timeline/custom_datepicker/CustomDatePicker";
import { DateTime } from "luxon";
import { useState } from "react";

const meta: Meta<typeof CustomDateTimePicker> = {
  title: "Timeline/CustomDatePicker",
  component: CustomDateTimePicker,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CustomDateTimePicker>;

const CustomDateTimePickerWithSetter = (
  args: Parameters<typeof CustomDateTimePicker>[0]
) => {
  // Sets the hooks for both the label and primary props
  const [value, setValue] = useState(DateTime.now());
  return <CustomDateTimePicker {...args} value={value} onChange={setValue} />;
};

export const Default: Story = {
  args: {
    label: "Date",
    textFieldProps: {
      error: false,
    },
  },
  render: (args) => <CustomDateTimePickerWithSetter {...args} />,
};
