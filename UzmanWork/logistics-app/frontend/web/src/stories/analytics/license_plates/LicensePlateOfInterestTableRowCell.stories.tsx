import type { Meta, StoryObj } from "@storybook/react";
import { NotificationGroup } from "coram-common-utils";
import { LicensePlateOfInterestTableRowCell } from "components/analytics/license_plates/LicensePlateOfInterestTableRowCell";
import { notification_group_handlers } from "mocks/notification_group_handlers";
import {
  generateRandomNotificationGroups,
  randomLicensePlateAlertProfile,
} from "stories/utils_stories";

const meta: Meta<typeof LicensePlateOfInterestTableRowCell> = {
  title: "LicensePlates/LicensePlateOfInterestTableRowCell",
  component: LicensePlateOfInterestTableRowCell,
  tags: ["autodocs"],
  parameters: {
    msw: {
      handlers: { ...notification_group_handlers },
    },
  },
};

export default meta;
type Story = StoryObj<typeof LicensePlateOfInterestTableRowCell>;

const NUM_GROUPS = 3;
const GROUPS: Map<number, NotificationGroup> = new Map(
  generateRandomNotificationGroups(NUM_GROUPS).map((group) => [group.id, group])
);

const ALERT_PROFILE = randomLicensePlateAlertProfile();

export const Default: Story = {
  args: {
    alertProfile: ALERT_PROFILE,
    notificationGroups: GROUPS,
  },
  render: (args) => <LicensePlateOfInterestTableRowCell {...args} />,
};
