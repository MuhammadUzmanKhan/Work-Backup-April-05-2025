import type { Meta, StoryObj } from "@storybook/react";
import { TimezoneTab } from "components/settings/TimezoneTab";
import { members_handlers } from "mocks/members_handlers";
import location_handlers from "mocks/location_handlers";

const meta: Meta<typeof TimezoneTab> = {
  title: "Settings/TimezoneTab",
  component: TimezoneTab,
  tags: ["autodocs"],
  parameters: {
    msw: {
      handlers: { ...members_handlers, ...location_handlers },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TimezoneTab>;

export const DefaultMemberAdd: Story = {};
