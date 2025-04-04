import type { Meta, StoryObj } from "@storybook/react";
import { camera_rtsp_updater_handler } from "mocks/streams_table_handlers";
import { useState } from "react";
import { RtspUrlUpdater } from "../components";

const meta: Meta<typeof RtspUrlUpdater> = {
  title: "Devices/CamerasTable/RtspUrlUpdater",
  component: RtspUrlUpdater,
  tags: ["autodocs"],
  parameters: {
    msw: {
      handlers: camera_rtsp_updater_handler,
    },
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof RtspUrlUpdater>;

function WrappedRtspUrlUpdater(props: Parameters<typeof RtspUrlUpdater>[0]) {
  const [rtspUrl, setRtspUrl] = useState(props.rtspUrl);

  return (
    <RtspUrlUpdater {...props} rtspUrl={rtspUrl} onRtspUrlChange={setRtspUrl} />
  );
}

export const Default: Story = {
  args: {
    macAddress: "00:00:00:00:00:00",
  },
  render: WrappedRtspUrlUpdater,
};
