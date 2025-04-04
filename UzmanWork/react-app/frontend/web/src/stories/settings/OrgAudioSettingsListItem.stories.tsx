import type { Meta, StoryObj } from "@storybook/react";
import { OrgAudioSettingsListItem } from "components/settings/OrgAudioSettingsListItem";
import organization_handlers from "mocks/organization_handlers";
import { isDefined, useOrganizations } from "coram-common-utils";

const meta: Meta<typeof OrgAudioSettingsListItem> = {
  title: "Settings/OrgAudioSettingsListItem",
  component: OrgAudioSettingsListItem,
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
type Story = StoryObj<typeof OrgAudioSettingsListItem>;

function OrgAudioSettingsWrapped() {
  const { data: organizations, refetch } = useOrganizations();
  const org = organizations.get(0);
  if (!isDefined(org)) {
    return <>Org not available yet</>;
  }

  return <OrgAudioSettingsListItem organization={org} refetch={refetch} />;
}

export const OrgAudioSettingsDefault: Story = {
  render: OrgAudioSettingsWrapped,
};
