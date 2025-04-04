import type { Meta, StoryObj } from "@storybook/react";
import { NVRResponse } from "coram-common-utils";
import { NvrsTableLabel } from "components/devices/NvrsTableLabel";
import streams_table_handlers from "mocks/streams_table_handlers";

const meta: Meta<typeof NvrsTableLabel> = {
  title: "Devices/NvrsTable/NvrsTableLabel",
  component: NvrsTableLabel,
  tags: ["autodocs"],
  parameters: {
    msw: {
      handlers: streams_table_handlers,
    },
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof NvrsTableLabel>;

const NVR: NVRResponse = {
  id: 1,
  uuid: "nvruuid",
  location_id: 1,
  is_online: true,
  location_name: "location1",
  address: "address1",
  num_cameras_enabled: 1,
  num_cameras_disabled: 2,
  retention_days: 60,
  max_cameras_slots: 5,
  num_available_cameras_slots: 2,
  org_name: "org1",
  org_tenant: "org1",
};

export const Default: Story = {
  args: {
    nvrs: [NVR, { ...NVR, is_online: false }],
    onNvrsClick: () => alert("Name clicked"),
    onOnlineNvrsClick: () => alert("Online clicked"),
    onOfflineNvrsClick: () => alert("Offline clicked"),
  },
};
