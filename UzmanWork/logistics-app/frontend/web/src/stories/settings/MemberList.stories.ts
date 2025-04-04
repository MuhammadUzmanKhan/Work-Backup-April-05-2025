import type { Meta, StoryObj } from "@storybook/react";
import { MemberList } from "components/settings/MemberList";
import { members_handlers } from "mocks/members_handlers";

const meta: Meta<typeof MemberList> = {
  title: "Members/MemberList",
  component: MemberList,
  tags: ["autodocs"],
  parameters: {
    msw: {
      handlers: members_handlers,
    },
  },
};

export default meta;
type Story = StoryObj<typeof MemberList>;

export const DefaultMemberList: Story = {};
