import type { Meta, StoryObj } from "@storybook/react";
import { OnlineStatus } from "../components";
import { KvsCheckerResult, DEFAULT_TIMEZONE } from "coram-common-utils";
import { DateTime } from "luxon";

const meta: Meta<typeof OnlineStatus> = {
  title: "Devices/NvrsTable/ConnectionStatusTableCell/OnlineStatus",
  component: OnlineStatus,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof OnlineStatus>;

export const Default: Story = {
  args: {
    internetStatus: {
      timestamp: DateTime.now().toISO() as string,
      domain: "coram.test",
      avg_ping_latency_ms: 22,
      packet_loss: 0,
      internet_speed: {
        download_speed_bps: 999999,
        upload_speed_bps: 999999,
        timestamp: DateTime.now().toISO() as string,
      },
    },
    kvsConnectionStatus: {
      check_result: KvsCheckerResult.KVS_CONNECTED,
    },
    timezone: DEFAULT_TIMEZONE,
  },
  render: (args) => <OnlineStatus {...args} />,
};

export const WithError: Story = {
  args: {
    ...Default.args,
    kvsConnectionStatus: {
      exception_msg: "Some error message",
      check_result: KvsCheckerResult.KVS_DISCONNECTED,
    },
  },
  render: (args) => <OnlineStatus {...args} />,
};
