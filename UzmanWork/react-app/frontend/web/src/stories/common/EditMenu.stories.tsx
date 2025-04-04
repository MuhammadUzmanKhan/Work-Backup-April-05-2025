import type { Meta, StoryObj } from "@storybook/react";

import { EditMenu } from "components/common/EditMenu";

const meta: Meta<typeof EditMenu> = {
  title: "Common/EditMenu",
  component: EditMenu,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof EditMenu>;

function EditMenuWrapped(args: Parameters<typeof EditMenu>[0]) {
  // Set up handlers for edit and delete actions
  const handleEdit = () => {
    alert("Edit action triggered");
  };
  const handleDelete = () => {
    alert("Delete action triggered");
  };
  const handleMenuOpen = (menuOpen: boolean) => {
    const message = `Menu ${menuOpen ? "opened" : "closed"}`;
    alert(`Action: ${message}`);
  };

  return (
    <EditMenu
      {...args}
      anchorEl={null}
      open={true}
      setMenuOpen={handleMenuOpen}
      onClose={() => handleMenuOpen(false)}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}

// Define the default story for the EditMenu
export const Default: Story = {
  args: {
    anchorEl: null,
    open: true,
    editLabel: "Rename",
    deleteLabel: "Delete",
    setMenuOpen: (menuOpen: boolean) => {
      const message = `Menu ${menuOpen ? "opened" : "closed"}`;
      alert(`Action: ${message}`);
    },
    onClose: () => {
      alert("Close action triggered");
    },
    onEdit: () => {
      alert("Edit action triggered");
    },
    onDelete: () => {
      alert("Delete action triggered");
    },
  },
  render: (args) => <EditMenuWrapped {...args} />,
};
