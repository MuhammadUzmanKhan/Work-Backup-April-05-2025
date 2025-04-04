import type { Meta, StoryObj } from "@storybook/react";
import { OrgFlagListItem } from "components/settings/OrgFlagListItem";
import location_handlers from "mocks/location_handlers";
import { members_handlers } from "mocks/members_handlers";
import { ORG_FLAG_LIST_ITEMS } from "utils/organization_flag_items";

const meta: Meta<typeof OrgFlagListItem> = {
  title: "Members/OrgFlagListItem",
  component: OrgFlagListItem,
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

const ORG_FLAG_ITEM = ORG_FLAG_LIST_ITEMS[0];

export default meta;
type Story = StoryObj<typeof OrgFlagListItem>;

export const DefaultOrgListItem: Story = {
  args: {
    flagEnum: ORG_FLAG_ITEM.flagEnum,
    Icon: ORG_FLAG_ITEM.Icon,
    primaryText: ORG_FLAG_ITEM.primaryText,
    secondaryText: ORG_FLAG_ITEM.secondaryText,
  },
};
