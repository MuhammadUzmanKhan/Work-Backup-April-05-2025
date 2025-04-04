import type { Meta, StoryObj } from "@storybook/react";
import { StatusCellPopover } from "components/devices/cameras_table_cells/StatusCell/StatusCellPopover";
import { CameraPipelineAlertType } from "coram-common-utils";
import { Stack, Typography } from "@mui/material";
import { useRef, useState } from "react";
import { DateTime } from "luxon";

const meta: Meta<typeof StatusCellPopover> = {
  title: "Devices/CamerasTable/StatusCellPopover",
  component: StatusCellPopover,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof StatusCellPopover>;

function StatusCellPopoverWrapped(
  args: Parameters<typeof StatusCellPopover>[0]
) {
  // Create an anchor ref for the popover
  const anchorEl = useRef<HTMLElement>(null);
  // State for popover
  const [open, setOpen] = useState(false);

  return (
    <Stack direction="row" alignItems="center" gap={1}>
      <Typography
        ref={anchorEl}
        variant="body1"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        Popover anchor element, please hover over me
      </Typography>
      <StatusCellPopover {...args} anchorEl={anchorEl.current} open={open} />
    </Stack>
  );
}

export const NoCameraErrorLastSeen: Story = {
  args: {
    showDetailedCameraErrorsEnabled: false,
    shouldShowCameraAlert: false,
    alertType: undefined,
    alertDetails: undefined,
    lastSeenTime: DateTime.fromISO("2021-08-05T18:00:00.000Z"),
  },
  render: (args) => <StatusCellPopoverWrapped {...args} />,
};

export const NoCameraErrorNeverSeen: Story = {
  args: {
    ...NoCameraErrorLastSeen.args,
    lastSeenTime: "Never",
  },
  render: (args) => <StatusCellPopoverWrapped {...args} />,
};

export const CameraErrorLastSeen: Story = {
  args: {
    ...NoCameraErrorLastSeen.args,
    showDetailedCameraErrorsEnabled: true,
    shouldShowCameraAlert: true,
    alertType: CameraPipelineAlertType.PRODUCER_HIGH_FPS,
    alertDetails: "alertDetails",
  },
  render: (args) => <StatusCellPopoverWrapped {...args} />,
};

export const CameraErrorNoLastSeen: Story = {
  args: {
    ...CameraErrorLastSeen.args,
    lastSeenTime: undefined,
  },
  render: (args) => <StatusCellPopoverWrapped {...args} />,
};

export const CameraErrorNeverSeen: Story = {
  args: {
    ...CameraErrorLastSeen.args,
    lastSeenTime: "Never",
  },
  render: (args) => <StatusCellPopoverWrapped {...args} />,
};
