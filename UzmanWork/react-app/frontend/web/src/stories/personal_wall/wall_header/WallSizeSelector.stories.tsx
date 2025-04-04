import type { Meta, StoryObj } from "@storybook/react";
import { WallSizeSelector } from "components/personal_wall/utils/WallSizeSelector";
import { useState } from "react";

const meta: Meta<typeof WallSizeSelector> = {
  title: "PersonalWall/WallHeader/WallSizeSelector",
  component: WallSizeSelector,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

function WallItemSelectorWrapped(args: Parameters<typeof WallSizeSelector>[0]) {
  const [value, setValue] = useState(100);
  return (
    <WallSizeSelector
      {...args}
      value={value}
      onChange={(value) => setValue(value)}
    />
  );
}

export default meta;
type Story = StoryObj<typeof WallItemSelectorWrapped>;

export const Interactions: Story = {
  args: {},
  render: (args) => <WallItemSelectorWrapped {...args} />,
};
