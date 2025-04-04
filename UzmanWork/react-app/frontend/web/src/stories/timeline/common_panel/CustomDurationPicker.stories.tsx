import type { Meta, StoryObj } from "@storybook/react";
import {
  CustomDurationPicker,
  ExpirationDurState,
} from "components/timeline/common_panel/CustomDurationPicker";
import { useState } from "react";

const meta: Meta<typeof CustomDurationPicker> = {
  title: "Timeline/common_panel/CustomDurationPicker",
  component: CustomDurationPicker,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof CustomDurationPicker>;

function CustomDurationPickerWithState(
  args: Parameters<typeof CustomDurationPicker>[0]
) {
  const [selectedOption, setSelectedOption] = useState<ExpirationDurState>({
    value: 1,
    unit: "hours",
  });

  return (
    <CustomDurationPicker
      {...args}
      expirationDur={selectedOption}
      setExpirationDur={setSelectedOption}
    />
  );
}

export const Default: Story = {
  args: {
    title: "Pick an option",
    options: ["hours", "days", "weeks"],
  },
  render: (args) => <CustomDurationPickerWithState {...args} />,
};

// TODO (balazs): Add a story that tests that the right option is highlighted on
// click.
