import type { Meta, StoryObj } from "@storybook/react";
import { OrgFlagSwitch } from "components/settings/OrgFlagSwitch";
import location_handlers from "mocks/location_handlers";
import {
  org_flag_error_handlers,
  members_handlers,
} from "mocks/members_handlers";

const meta: Meta<typeof OrgFlagSwitch> = {
  title: "Members/OrgFlagSwitch",
  component: OrgFlagSwitch,
  tags: ["autodocs"],
  parameters: {
    msw: {
      handlers: {
        ...members_handlers,
        ...location_handlers,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof OrgFlagSwitch>;

export const DefaultOrgFlagSwitch: Story = {};

export const ErrorAPIOrgFlagSwitch: Story = {
  parameters: {
    msw: {
      handlers: {
        ...members_handlers,
        ...location_handlers,
        ...org_flag_error_handlers,
      },
    },
  },
};
