import type { Meta, StoryObj } from "@storybook/react";
import { LicensePlateOfInterestTable } from "components/analytics/license_plates/LicensePlateOfInterestTable";
import { LicensePlateTableSortKeys } from "components/analytics/license_plates/LicensePlateTab";
import { notification_group_handlers } from "mocks/notification_group_handlers";
import { generateRandomLicensePlateResponses } from "stories/utils_stories";
import { useSortable } from "utils/sortable";

const meta: Meta<typeof LicensePlateOfInterestTable> = {
  title: "LicensePlates/LicensePlateOfInterestTable",
  component: LicensePlateOfInterestTable,
  tags: ["autodocs"],
  parameters: {
    msw: {
      handlers: { ...notification_group_handlers },
    },
  },
};

export default meta;
type Story = StoryObj<typeof LicensePlateOfInterestTable>;

function WrappedLPOITable(
  args: Parameters<typeof LicensePlateOfInterestTable>[0]
) {
  const sortable = useSortable<LicensePlateTableSortKeys>("last_seen", "desc");
  return <LicensePlateOfInterestTable {...args} sortable={sortable} />;
}

const NUM_LICENSE_PLATES = 20;

export const Default: Story = {
  args: {
    licensePlates: generateRandomLicensePlateResponses(NUM_LICENSE_PLATES),
    paginationData: {
      page: 0,
      itemsPerPage: 10,
    },
    setSelectedLicensePlate: () => null,
  },
  render: (args) => <WrappedLPOITable {...args} />,
};
