import type { Meta, StoryObj } from "@storybook/react";
import { TriageController } from "components/personal_wall/multi_video_controls/timebar/TriageController";
import { useState } from "react";

const meta: Meta<typeof TriageController> = {
  title: "PersonalWall/MultiVideoControls/TimeBar/TriageController",
  component: TriageController,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof TriageController>;

function TriageControllerBarWrapped(
  props: Parameters<typeof TriageController>[0]
) {
  const [isDragging, setIsDragging] = useState<boolean>(false);

  return (
    <TriageController
      {...props}
      isDragging={isDragging}
      value={0.5}
      tooltipText="test tooltip"
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
    />
  );
}

export const Interactions: Story = {
  args: {
    iconWidth: 60,
  },
  render: (args) => <TriageControllerBarWrapped {...args} />,
};
