import type { Meta, StoryObj } from "@storybook/react";
import { LicensePlateTableRow } from "components/analytics/license_plates/LicensePlateTableRow";
import { generateRandomLicensePlateResponses } from "stories/utils_stories";

const meta: Meta<typeof LicensePlateTableRow> = {
  title: "LicensePlates/LicensePlateTableRow",
  component: LicensePlateTableRow,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof LicensePlateTableRow>;

export const Default: Story = {
  args: {
    item: generateRandomLicensePlateResponses(1)[0],
    setSelectedLicensePlate: () => null,
  },
  render: (args) => <LicensePlateTableRow {...args} />,
};
