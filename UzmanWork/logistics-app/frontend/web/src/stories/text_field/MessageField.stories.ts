import type { Meta, StoryObj } from "@storybook/react";
import { MessageField } from "components/MessageField";

const meta: Meta<typeof MessageField> = {
  title: "MessageField/MessageField",
  component: MessageField,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof MessageField>;

export const BasicMessageField: Story = {};
