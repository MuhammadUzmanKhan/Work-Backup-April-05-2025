import type { Meta, StoryObj } from "@storybook/react";
import { MemberAdd } from "components/settings/MemberAdd";
import { members_handlers } from "mocks/members_handlers";

const meta: Meta<typeof MemberAdd> = {
  title: "Members/MemberAdd",
  component: MemberAdd,
  tags: ["autodocs"],
  parameters: {
    msw: {
      handlers: members_handlers,
    },
  },
};

export default meta;
type Story = StoryObj<typeof MemberAdd>;

export const DefaultMemberAdd: Story = {};
