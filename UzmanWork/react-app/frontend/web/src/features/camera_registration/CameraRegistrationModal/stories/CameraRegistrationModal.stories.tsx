import { Button } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { CameraRegistrationModal } from "../CameraRegistrationModal";
import {
  camera_registration_handlers,
  camera_registration_handlers_no_candidates,
} from "mocks/camera_registration_handlers";
import location_handlers from "mocks/location_handlers";
import { useState } from "react";

const meta: Meta<typeof CameraRegistrationModal> = {
  title: "Camera Registration/CameraRegistrationModal",
  component: CameraRegistrationModal,
  tags: ["autodocs"],
  parameters: {
    msw: {
      handlers: { ...location_handlers, ...camera_registration_handlers },
    },
  },
};

function WrappedCameraRegistrationModal() {
  const [open, setOpen] = useState<boolean>(true);

  return (
    <>
      <Button onClick={() => setOpen(!open)}>Open</Button>
      <CameraRegistrationModal
        open={open}
        setOpen={setOpen}
        onCameraRegistrationSuccess={() => null}
      />
    </>
  );
}

export default meta;
type Story = StoryObj<typeof CameraRegistrationModal>;

export const ModalInteractions: Story = {
  render: WrappedCameraRegistrationModal,
};

export const ModalInteractionsNoCamerasFound: Story = {
  parameters: {
    msw: {
      handlers: {
        ...location_handlers,
        ...camera_registration_handlers_no_candidates,
      },
    },
  },
  render: WrappedCameraRegistrationModal,
};
