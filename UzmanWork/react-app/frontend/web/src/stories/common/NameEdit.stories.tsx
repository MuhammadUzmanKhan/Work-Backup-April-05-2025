import type { Meta, StoryObj } from "@storybook/react";

import { NameEdit } from "components/common/NameEdit";
import { useState } from "react";

const meta: Meta<typeof NameEdit> = {
  title: "Common/NameEdit",
  component: NameEdit,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof NameEdit>;

function NameEditWrapped(args: Parameters<typeof NameEdit>[0]) {
  const [, setIsEditing] = useState(false);
  return <NameEdit {...args} setIsEditing={setIsEditing} />;
}

export const Default: Story = {
  args: {
    prevName: "prev name",
    onSubmit: async () => {
      alert("onSubmit called");
    },
    maxNameLength: 10,
  },
  render: (args) => <NameEditWrapped {...args} />,
};
