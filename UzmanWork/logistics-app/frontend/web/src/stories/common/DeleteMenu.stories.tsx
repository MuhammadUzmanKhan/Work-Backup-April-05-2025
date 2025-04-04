import type { Meta, StoryObj } from "@storybook/react";

import { DeleteMenu } from "components/common/DeleteMenu";

const meta: Meta<typeof DeleteMenu> = {
  title: "Common/DeleteMenu",
  component: DeleteMenu,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof DeleteMenu>;

// Define the default story for the DeleteMenu
export const Default: Story = {
  args: {
    anchorEl: null,
    open: true,
    deleteLabel: "Delete",
    setMenuOpen: (menuOpen: boolean) => {
      const message = `Menu ${menuOpen ? "opened" : "closed"}`;
      alert(`Action: ${message}`);
    },
    onClose: () => {
      alert("Close action triggered");
    },
    onDelete: () => {
      alert("Delete action triggered");
    },
  },
  render: (args) => <DeleteMenu {...args} />,
};
