import type { Meta, StoryObj } from "@storybook/react";

import { KioskDrawer } from "components/kiosk/editor/KioskDrawer";
import { KioskDrawerMode } from "components/kiosk/editor/utils";
import { useState } from "react";

const meta: Meta<typeof KioskDrawer> = {
  title: "Kiosk/Editor/KioskDrawer",
  component: KioskDrawer,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof KioskDrawer>;

function KioskDrawerWrapped(args: Parameters<typeof KioskDrawer>[0]) {
  const [open, setOpen] = useState(true);
  return <KioskDrawer {...args} open={open} setOpen={setOpen} />;
}

export const Default: Story = {
  args: {
    initialKiosk: {
      walls: [
        {
          owner_user_email: "owner_user_email1",
          name: "wall1",
          id: 1,
        },
        {
          owner_user_email: "owner_user_email1",
          name: "wall2",
          id: 2,
        },
      ],
      rotateFrequencyS: 30,
    },
    userWalls: [
      {
        owner_user_email: "owner_user_email1",
        name: "wall1",
        id: 1,
      },
      {
        owner_user_email: "owner_user_email1",
        name: "wall2",
        id: 2,
      },
      {
        owner_user_email: "owner_user_email1",
        name: "wall3",
        id: 3,
      },
    ],
    drawerMode: KioskDrawerMode.Edit,
    onKioskSubmit: async () => {
      alert("onKioskSubmit called");
    },
  },
  render: (args) => <KioskDrawerWrapped {...args} />,
};
