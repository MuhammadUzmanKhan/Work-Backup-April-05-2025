import type { Meta, StoryObj } from "@storybook/react";
import { MembersTab } from "components/settings/MembersTab";
import { members_handlers } from "mocks/members_handlers";

const meta: Meta<typeof MembersTab> = {
  title: "Members/Members",
  component: MembersTab,
  tags: ["autodocs"],
  parameters: {
    msw: {
      handlers: members_handlers,
    },
  },
};

export default meta;
type Story = StoryObj<typeof MembersTab>;

export const DefaultMembers: Story = {};
