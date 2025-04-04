import type { Meta, StoryObj } from "@storybook/react";
import { AccessLogDetailsRow } from "../AccessLogDetailsRow";

const meta: Meta<typeof AccessLogDetailsRow> = {
  title: "AccessLogs/AccessLogDetailsRow",
  component: AccessLogDetailsRow,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AccessLogDetailsRow>;

export const Default: Story = {
  args: {
    open: true,
    logDetails: {
      mac_address: "00:00:00:00:00:00",
      camera_id: "camera_id",
      timezone: "GMT",
      time: "2022-02-03T16:00:00Z",
      url_path: "url_path",
    },
    camerasInfoMap: new Map([
      ["00:00:00:00:00:00", { id: 1, name: "MyCamera" }],
    ]),
  },
};
