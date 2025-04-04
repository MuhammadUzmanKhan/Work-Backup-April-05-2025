import type { Meta, StoryObj } from "@storybook/react";
import { LicensePlateTableSortKeys } from "components/analytics/license_plates/LicensePlateTab";
import { LicensePlateTableHeadRow } from "components/analytics/license_plates/LicensePlateTableHeadRow";
import { useSortable } from "utils/sortable";

const meta: Meta<typeof LicensePlateTableHeadRow> = {
  title: "LicensePlates/LicensePlateTableHeadRow",
  component: LicensePlateTableHeadRow,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof LicensePlateTableHeadRow>;

function WrappedLicensePlateTableHeadRow() {
  const sortable = useSortable<LicensePlateTableSortKeys>("last_seen", "desc");

  return <LicensePlateTableHeadRow sortable={sortable} />;
}

export const Default: Story = {
  render: WrappedLicensePlateTableHeadRow,
};
