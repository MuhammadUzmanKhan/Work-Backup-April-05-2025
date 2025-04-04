import type { Meta, StoryObj } from "@storybook/react";
import { CustomDatePicker } from "components/common/CustomDatePicker";
import { DateTime } from "luxon";

const meta: Meta<typeof CustomDatePicker> = {
  title: "Common/CustomDatePicker",
  component: CustomDatePicker,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof CustomDatePicker>;

// Define the default story for the CustomDatePicker
export const Default: Story = {
  args: {
    value: DateTime.now(),
    label: "Start Date",
    onChange: () => null,
  },
  render: (args) => <CustomDatePicker {...args} />,
};
