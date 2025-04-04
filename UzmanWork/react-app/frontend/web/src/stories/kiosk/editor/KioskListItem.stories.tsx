import type { Meta, StoryObj } from "@storybook/react";

import { KioskListItem } from "components/kiosk/editor/KioskListItem";
import {
  RenameKioskRequest,
  ShareKioskRequest,
  UpdateKioskStatusRequest,
  UpdateWallsForKioskRequest,
} from "coram-common-utils";

const meta: Meta<typeof KioskListItem> = {
  title: "Kiosk/Editor/KioskListItem",
  component: KioskListItem,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof KioskListItem>;

export const Default: Story = {
  args: {
    kiosk: {
      creator_user_email: "owner_user_email1",
      name: "kiosk name",
      rotate_frequency_s: 30,
      is_enabled: true,
      id: 1,
      hash: "hash1",
      tenant: "tenant1",
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
    ],
    currentUserEmail: "owner_user_email1",
    onUpdateKioskWalls: async (request: UpdateWallsForKioskRequest) => {
      alert(
        `onUpdateKioskWalls called with request=${JSON.stringify(request)}`
      );
    },
    onUpdateKioskStatus: async (request: UpdateKioskStatusRequest) => {
      alert(
        `onUpdateKioskStatus called with request=${JSON.stringify(request)}`
      );
    },
    onRemoveKiosk: async (kiosk_id: number) => {
      alert(`onRemoveKiosk called with kiosk_id=${kiosk_id}`);
    },
    onRegenerateKioskHash: async (kiosk_id: number) => {
      alert(`onRegenerateKioskHash called with kiosk_id=${kiosk_id}`);
    },
    onRenameKiosk: async (request: RenameKioskRequest) => {
      alert(`onRenameKiosk called with request=${JSON.stringify(request)}`);
    },
    onShareKiosk: async (request: ShareKioskRequest) => {
      alert(`onShareKiosk called with request=${JSON.stringify(request)}`);
    },
  },
};
