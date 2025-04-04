import type { Meta, StoryObj } from "@storybook/react";
import { MultiEmailTextField } from "components/MutliEmailTextField";
import { ShareWithEmails } from "components/ShareDialog";
import { useState } from "react";

const EMAILS = {
  finalizedEmails: ["user_a@coram.ai", "user_b@coram.ai"],
  currentEmail: "",
};

const meta: Meta<typeof MultiEmailTextField> = {
  title: "Timeline/MultiEmailTextField",
  component: MultiEmailTextField,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

function MultiEmailTextFieldWrapped() {
  const [shareWithEmails, setShareWithEmails] =
    useState<ShareWithEmails>(EMAILS);
  return (
    <MultiEmailTextField
      fullWidth
      autoFocus
      margin="dense"
      setShareWithEmails={setShareWithEmails}
      shareWithEmails={shareWithEmails}
    />
  );
}

export default meta;
type Story = StoryObj<typeof MultiEmailTextField>;

export const Default: Story = {
  render: () => <MultiEmailTextFieldWrapped />,
};
