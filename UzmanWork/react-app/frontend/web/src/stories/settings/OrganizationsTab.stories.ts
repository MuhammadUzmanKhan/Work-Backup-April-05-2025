import type { Meta, StoryObj } from "@storybook/react";
import { MemberList } from "components/settings/MemberList";
import { OrganizationsTab } from "components/settings/OrganizationsTab";
import organization_handler from "mocks/organization_handlers";

const meta: Meta<typeof MemberList> = {
  title: "Settings/OrganizationsTab",
  component: OrganizationsTab,
  tags: ["autodocs"],
  parameters: {
    msw: {
      handlers: organization_handler,
    },
  },
};

export default meta;
type Story = StoryObj<typeof OrganizationsTab>;

export const DefaultOrganizationsTab: Story = {};
