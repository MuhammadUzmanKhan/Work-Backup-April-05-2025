import type { Meta, StoryObj } from "@storybook/react";

import { useState } from "react";
import { WallFilters, WallParams } from "./WallFilters";

const meta: Meta<typeof WallFilters> = {
  title: "wall/WallFilters",
  component: WallFilters,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof WallFilters>;

function WallFiltersWrapped(args: Parameters<typeof WallFilters>[0]) {
  const [wallParams, setWallParams] = useState<WallParams>({
    cameraGroup: undefined,
    location: undefined,
    organization: null,
  });
  return (
    <WallFilters
      {...args}
      wallParams={wallParams}
      setWallParams={setWallParams}
    />
  );
}

const LOCATION_LONG_NAME = {
  name: "long location name very long indeed",
  address: "1234 Long Street, Long, 12345",
  id: 1,
  timezone: "America/Los_Angeles",
  enable_setting_timezone: true,
};

const GROUP_LONG_NAME = {
  id: 1,
  name: "long group name very long indeed",
  is_default: true,
  tenant: "tenant",
  location_ids: [1],
};

export const Default: Story = {
  args: {
    locations: new Map([[1, LOCATION_LONG_NAME]]),
    groups: new Map([[1, GROUP_LONG_NAME]]),
    wallParams: {
      cameraGroup: undefined,
      location: undefined,
      organization: null,
    },

    onChange: () => null,
  },
  render: (args) => <WallFiltersWrapped {...args} />,
};
