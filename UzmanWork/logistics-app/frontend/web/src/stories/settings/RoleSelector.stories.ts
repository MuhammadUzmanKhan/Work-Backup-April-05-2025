import type { Meta, StoryObj } from "@storybook/react";
import { UserRole } from "coram-common-utils";
import { RoleSelector } from "components/settings/RoleSelector";

const meta: Meta<typeof RoleSelector> = {
  title: "Members/RoleSelector",
  component: RoleSelector,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof RoleSelector>;

export const Default: Story = {
  args: {
    initialRole: UserRole.ADMIN,
  },
};

export const CustomStyle: Story = {
  args: {
    initialRole: UserRole.ADMIN,
    sx: {
      fontWeight: "bold",
      color: "red",
    },
  },
};
