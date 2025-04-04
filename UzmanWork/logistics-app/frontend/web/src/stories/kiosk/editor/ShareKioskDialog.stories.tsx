import type { Meta, StoryObj } from "@storybook/react";
import { ShareKioskRequest } from "coram-common-utils";

import { ShareKioskDialog } from "components/kiosk/editor/ShareKioskDialog";
import { useState } from "react";

const meta: Meta<typeof ShareKioskDialog> = {
  title: "Kiosk/Editor/ShareKioskDialog",
  component: ShareKioskDialog,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ShareKioskDialog>;

function ShareKioskDialogWrapped(args: Parameters<typeof ShareKioskDialog>[0]) {
  const [open, setOpen] = useState(true);
  return (
    <ShareKioskDialog {...args} dialogOpen={open} setDialogOpen={setOpen} />
  );
}

export const Default: Story = {
  args: {
    kioskId: 1,
    onShareKiosk: async (request: ShareKioskRequest) => {
      alert(`onShareKiosk called with ${JSON.stringify(request)}`);
    },
  },
  render: (args) => <ShareKioskDialogWrapped {...args} />,
};
