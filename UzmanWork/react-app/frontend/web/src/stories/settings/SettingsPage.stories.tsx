import type { Meta, StoryObj } from "@storybook/react";
import location_handlers from "mocks/location_handlers";
import { members_handlers } from "mocks/members_handlers";
import { SettingsPage } from "pages/SettingsPage";

const meta: Meta<typeof SettingsPage> = {
  title: "Settings/SettingsPage",
  component: SettingsPage,
  tags: ["autodocs"],
  parameters: {
    msw: {
      handlers: { ...members_handlers, ...location_handlers },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SettingsPage>;

export const DefaultSettingsPage: Story = {};
