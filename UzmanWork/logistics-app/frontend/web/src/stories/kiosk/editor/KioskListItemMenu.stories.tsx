import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";

import { KioskListItemMenu } from "components/kiosk/editor/KioskListItemMenu";
import { useState } from "react";
import { MoreVert as MoreVertIcon } from "@mui/icons-material";

const meta: Meta<typeof KioskListItemMenu> = {
  title: "Kiosk/Editor/KioskListItemMenu",
  component: KioskListItemMenu,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof KioskListItemMenu>;

function KioskListItemMenuWrapped(
  args: Parameters<typeof KioskListItemMenu>[0]
) {
  const [anchorEl, setAnchorEl] = useState<
    null | (EventTarget & SVGSVGElement)
  >(null);
  return (
    <Box>
      <MoreVertIcon
        sx={{
          cursor: "pointer",
        }}
        onClick={(ev) => setAnchorEl(ev.currentTarget)}
      />
      <KioskListItemMenu
        {...args}
        setOpenDrawer={() => {
          alert("setOpenDrawer called");
        }}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
      />
    </Box>
  );
}

export const Default: Story = {
  args: {
    kioskId: 1,
    kioskOwnerEmail: "owner_user_email1",
    currentUserEmail: "owner_user_email1",
    onRemoveKiosk: async (kiosk_id: number) => {
      alert(`onRemoveKiosk called with kiosk_id=${kiosk_id}`);
    },
    onShareClick: () => {
      alert("onShareClick called");
    },
  },
  render: (args) => <KioskListItemMenuWrapped {...args} />,
};

export const NotOwnerUser: Story = {
  args: {
    ...Default.args,
    currentUserEmail: "other_user_email",
  },
  render: (args) => <KioskListItemMenuWrapped {...args} />,
};
