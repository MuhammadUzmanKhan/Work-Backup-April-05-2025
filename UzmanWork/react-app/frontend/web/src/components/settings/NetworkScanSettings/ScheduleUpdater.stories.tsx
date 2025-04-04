import type { Meta, StoryObj } from "@storybook/react";

import { useState } from "react";
import { ScheduleUpdater } from "./ScanScheduleUpdate";
import { NetworkScanScheduled } from "coram-common-utils";
import { DEFAULT_SCHEDULED_SCAN_SETTINGS } from "./constants";

const meta: Meta<typeof ScheduleUpdater> = {
  title: "Settings/ScheduleUpdater",
  component: ScheduleUpdater,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ScheduleUpdater>;

function ScheduleUpdaterWrapped(args: Parameters<typeof ScheduleUpdater>[0]) {
  const [networkScanSettings, setNetworkScanSettings] =
    useState<NetworkScanScheduled>(DEFAULT_SCHEDULED_SCAN_SETTINGS);

  return (
    <ScheduleUpdater
      {...args}
      networkScanSettings={networkScanSettings}
      setLocalNetworkScanSettings={setNetworkScanSettings}
    />
  );
}

export const Default: Story = {
  args: {},
  render: (args) => <ScheduleUpdaterWrapped {...args} />,
};
