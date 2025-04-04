import type { Meta, StoryObj } from "@storybook/react";
import devices_page_handlers from "mocks/devices_handlers";
import { DevicesPageDesktop } from "pages/DevicesPageDesktop";

const meta: Meta<typeof DevicesPageDesktop> = {
  title: "Devices/DevicesPageDesktop",
  component: DevicesPageDesktop,
  tags: ["autodocs"],
  parameters: {
    msw: {
      handlers: devices_page_handlers,
    },
  },
};

export default meta;
type Story = StoryObj<typeof DevicesPageDesktop>;

export const DefaultDevicesPage: Story = {};
