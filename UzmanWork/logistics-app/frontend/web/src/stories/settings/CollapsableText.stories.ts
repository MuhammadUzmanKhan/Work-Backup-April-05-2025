import type { Meta, StoryObj } from "@storybook/react";
import { CollapsableText } from "components/settings/CollapsableText";

const meta: Meta<typeof CollapsableText> = {
  title: "Settings/CollapsableText",
  component: CollapsableText,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof CollapsableText>;

export const CollapsableTextDefault: Story = {
  args: {
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    numWordsLimit: 15,
  },
};
