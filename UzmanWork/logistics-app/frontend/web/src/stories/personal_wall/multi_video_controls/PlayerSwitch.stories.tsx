import type { Meta, StoryObj } from "@storybook/react";
import { PlayerSwitch } from "components/personal_wall/multi_video_controls/PlayerSwitch";
import { useState } from "react";

const meta: Meta<typeof PlayerSwitch> = {
  title: "PersonalWall/MultiVideoControls/PlayerSwitch",
  component: PlayerSwitch,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof PlayerSwitch>;

function PlayerSwitchWrapped(props: Parameters<typeof PlayerSwitch>[0]) {
  const [checked, setChecked] = useState<boolean>(props.checked);

  return (
    <PlayerSwitch
      {...props}
      onChange={(checked) => setChecked(checked)}
      checked={checked}
    />
  );
}

export const Interactions: Story = {
  args: {
    checked: false,
  },
  render: (args) => <PlayerSwitchWrapped {...args} />,
};
