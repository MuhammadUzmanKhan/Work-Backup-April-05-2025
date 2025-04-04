import type { Meta, StoryObj } from "@storybook/react";
import { OrgWebRTCSettingsListItem } from "components/settings/OrgWebrtcSettingsListItem";
import { isDefined, useOrganizations } from "coram-common-utils";
import devices_page_handlers from "mocks/devices_handlers";

const meta: Meta<typeof OrgWebRTCSettingsListItem> = {
  title: "Settings/OrgWebRTCSettingsListItem",
  component: OrgWebRTCSettingsListItem,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    msw: {
      handlers: {
        ...devices_page_handlers,
      },
    },
  },
};

function OrgWebRTCSettingsListItemWrapped() {
  const { data: organizations, refetch } = useOrganizations();
  const org = organizations.get(0);
  if (!isDefined(org)) {
    return <>Org not available yet</>;
  }

  return <OrgWebRTCSettingsListItem organization={org} refetch={refetch} />;
}

export default meta;
type Story = StoryObj<typeof OrgWebRTCSettingsListItem>;

export const OrgWebrtcListItemDefault: Story = {
  render: OrgWebRTCSettingsListItemWrapped,
};
