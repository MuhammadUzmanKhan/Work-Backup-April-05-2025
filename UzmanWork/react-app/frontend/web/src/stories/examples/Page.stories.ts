import type { Meta, StoryObj } from "@storybook/react";

import { Page } from "./Page";

const meta: Meta<typeof Page> = {
  title: "Example/Page",
  component: Page,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof Page>;

export const LoggedOut: Story = {};
