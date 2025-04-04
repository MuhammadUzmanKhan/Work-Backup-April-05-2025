import { Meta, StoryObj } from "@storybook/react";
import { HealthTab } from "../HealthTab";
import { DateTime } from "luxon";
import {
  OFFLINE_CAMERA_WITH_DOWNTIME_RESPONSE,
  OFFLINE_CAMERA_WITHOUT_DOWNTIME_RESPONSE,
  ONLINE_CAMERA_WITHOUT_DOWNTIME_RESPONSE,
} from "./consts";
import { apiMocks } from "./apiMocks";

const meta: Meta<typeof HealthTab> = {
  title: "Devices/CamerasTable/CameraSettingsDrawer/HealthTab",
  component: HealthTab,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    msw: {
      handlers: {
        ...apiMocks,
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof HealthTab>;

export const Default: Story = {
  args: {
    cameraId: OFFLINE_CAMERA_WITH_DOWNTIME_RESPONSE.camera.id,
    cameraMacAddress: OFFLINE_CAMERA_WITH_DOWNTIME_RESPONSE.camera.mac_address,
    isOnline: OFFLINE_CAMERA_WITH_DOWNTIME_RESPONSE.camera.is_online,
    lastSeenTime: DateTime.fromISO(
      OFFLINE_CAMERA_WITH_DOWNTIME_RESPONSE.camera.last_seen_time as string
    ),
  },
  render: (args) => <HealthTab {...args} />,
};

export const NegativeUptimeTestCase: Story = {
  args: {
    cameraId: OFFLINE_CAMERA_WITHOUT_DOWNTIME_RESPONSE.camera.id,
    cameraMacAddress:
      OFFLINE_CAMERA_WITHOUT_DOWNTIME_RESPONSE.camera.mac_address,
    isOnline: OFFLINE_CAMERA_WITHOUT_DOWNTIME_RESPONSE.camera.is_online,
    lastSeenTime: DateTime.fromISO(
      OFFLINE_CAMERA_WITHOUT_DOWNTIME_RESPONSE.camera.last_seen_time as string
    ),
  },
  render: (args) => <HealthTab {...args} />,
};

export const AllwaysOnlineTestCase: Story = {
  args: {
    cameraId: ONLINE_CAMERA_WITHOUT_DOWNTIME_RESPONSE.camera.id,
    cameraMacAddress:
      ONLINE_CAMERA_WITHOUT_DOWNTIME_RESPONSE.camera.mac_address,
    isOnline: ONLINE_CAMERA_WITHOUT_DOWNTIME_RESPONSE.camera.is_online,
    lastSeenTime: DateTime.fromISO(
      ONLINE_CAMERA_WITHOUT_DOWNTIME_RESPONSE.camera.last_seen_time as string
    ),
  },
  render: (args) => <HealthTab {...args} />,
};
