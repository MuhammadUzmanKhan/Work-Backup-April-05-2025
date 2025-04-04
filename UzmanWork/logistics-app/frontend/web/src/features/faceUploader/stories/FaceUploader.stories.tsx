import type { Meta, StoryObj } from "@storybook/react";

import { useState } from "react";
import { FaceUploaderDialog } from "../FaceUploader";
import { Button } from "@mui/material";

const meta: Meta<typeof FaceUploaderDialog> = {
  title: "FaceUploader/FaceUploaderDialog",
  component: FaceUploaderDialog,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof FaceUploaderDialog>;

function FaceUploaderDialogWrapped(
  args: Parameters<typeof FaceUploaderDialog>[0]
) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <FaceUploaderDialog
        {...args}
        open={open}
        onClose={() => setOpen(false)}
      />
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Open Dialog
      </Button>
    </>
  );
}

export const Default: Story = {
  args: {},
  render: (args) => <FaceUploaderDialogWrapped {...args} />,
};
