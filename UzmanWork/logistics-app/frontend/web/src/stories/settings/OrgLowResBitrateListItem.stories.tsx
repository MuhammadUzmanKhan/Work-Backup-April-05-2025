import type { Meta, StoryObj } from "@storybook/react";
import { OrgLowResBitrateListItem } from "components/settings/OrgLowResBitrateListItem";
import organization_handlers from "mocks/organization_handlers";
import { isDefined, useOrganizations } from "coram-common-utils";

const meta: Meta<typeof OrgLowResBitrateListItem> = {
  title: "Settings/OrgLowResBitrateListItem",
  component: OrgLowResBitrateListItem,
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
type Story = StoryObj<typeof OrgLowResBitrateListItem>;

function OrgLowResBitrateWrapped() {
  const { data: organizations, refetch } = useOrganizations();
  const org = organizations.get(0);
  if (!isDefined(org)) {
    return <>Org not available yet</>;
  }

  return <OrgLowResBitrateListItem organization={org} refetch={refetch} />;
}

export const OrgLowResBitrateDefault: Story = {
  render: OrgLowResBitrateWrapped,
};
