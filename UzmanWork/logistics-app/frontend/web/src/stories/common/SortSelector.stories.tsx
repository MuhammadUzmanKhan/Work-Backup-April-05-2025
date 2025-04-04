import type { Meta, StoryObj } from "@storybook/react";
import { SortSelector } from "components/common/SortSelector";

const meta: Meta<typeof SortSelector> = {
  title: "Common/SortSelector",
  component: SortSelector,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof SortSelector>;

export const DefaultSortSelector: Story = {
  args: {
    value: "asc",
    onChange: () => null,
  },
  render: (args) => <SortSelector {...args} />,
};
