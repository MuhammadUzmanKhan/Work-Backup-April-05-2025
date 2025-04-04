import type { Meta, StoryObj } from "@storybook/react";
import { OrgNumberLicensedCamerasListItem } from "components/settings/OrgNumberLicensedCamerasListItem";
import organization_handlers from "mocks/organization_handlers";

const meta: Meta<typeof OrgNumberLicensedCamerasListItem> = {
  title: "Settings/OrgNumberLicenseCamerasListItem",
  component: OrgNumberLicensedCamerasListItem,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    msw: {
      handlers: {
        ...organization_handlers,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof OrgNumberLicensedCamerasListItem>;

export const OrgNumberLicenseCamerasListItemDefault: Story = {
  args: {
    refetch: () => null,
  },
};
