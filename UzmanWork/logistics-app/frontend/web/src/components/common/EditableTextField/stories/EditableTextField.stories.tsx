import type { Meta, StoryObj } from "@storybook/react";
import { EditableTextField } from "../EditableTextField";
import { Box } from "@mui/material";
import { useState } from "react";

const meta: Meta<typeof EditableTextField> = {
  title: "common/components/EditableTextField",
  component: EditableTextField,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof EditableTextField>;

function WrappedEditableTextField() {
  const [value, setValue] = useState("Hello, world!");
  return (
    <Box width="400px" height="300px">
      <EditableTextField
        value={value}
        onChange={setValue}
        placeholder="Click to Edit"
      />
    </Box>
  );
}

export const Default: Story = {
  render: () => <WrappedEditableTextField />,
};
