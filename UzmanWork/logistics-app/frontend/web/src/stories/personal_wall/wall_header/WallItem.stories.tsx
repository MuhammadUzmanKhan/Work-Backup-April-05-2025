import type { Meta, StoryObj } from "@storybook/react";
import { WallItem } from "components/personal_wall/utils/WallItem";
import { useState } from "react";

const meta: Meta<typeof WallItem> = {
  title: "PersonalWall/WallHeader/WallItem",
  component: WallItem,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

function WallItemWrapped(args: Parameters<typeof WallItem>[0]) {
  const [wallName, setWallName] = useState(args.wallName);

  return (
    <WallItem
      {...args}
      wallName={wallName}
      onWallRename={async (name) => setWallName(name)}
    />
  );
}

export default meta;
type Story = StoryObj<typeof WallItem>;

export const Interactions: Story = {
  args: {
    wallName: "Test Wall",
    onWallClick: () => alert("Wall clicked"),
    onWallEdit: () => alert("Wall edited"),
    onWallRemove: async () => alert("Wall removed"),
    onWallShare: async () => alert("Wall shared"),
    isSelected: false,
  },
  render: (args) => <WallItemWrapped {...args} />,
};
