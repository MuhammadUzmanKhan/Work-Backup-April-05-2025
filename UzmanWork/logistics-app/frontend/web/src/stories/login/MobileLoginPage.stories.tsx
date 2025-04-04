import type { Meta, StoryObj } from "@storybook/react";
import { MobileLoginPage } from "pages/MobileLoginPage";

const meta: Meta<typeof MobileLoginPage> = {
  title: "Login/MobileLoginPage",
  component: MobileLoginPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof MobileLoginPage>;

export const Default: Story = {};
