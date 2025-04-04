import { useState } from "react";
import { Container } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { CameraRegistrationItemMobile } from "components/devices/Mobile/CameraRegistrationItemMobile";
import { CandidateCamera } from "features/camera_registration/types";

const meta: Meta<typeof CameraRegistrationItemMobile> = {
  title: "Devices/CameraRegistrationItemMobile",
  component: CameraRegistrationItemMobile,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof CameraRegistrationItemMobile>;

const mockCandidate: CandidateCamera = {
  data: {
    mac_address: "00:11:22:33:44:55",
    ip: "192.168.1.100",
    vendor: "Dummy Vendor",
    username: "admin",
    password: "123456",
    nvr_uuids: [],
  },
  selected: true,
  idx: 1,
};

function WrappedCameraRegistrationItemMobile() {
  const [candidate, setCandidate] = useState(mockCandidate);
  return (
    <Container>
      <CameraRegistrationItemMobile
        candidate={candidate}
        onCameraToggle={() =>
          setCandidate((prev) => ({
            ...prev,
            selected: !candidate.selected,
          }))
        }
        onCameraUsernameChange={(macAddress, username) =>
          setCandidate((prev) => ({
            ...prev,
            data: {
              ...prev.data,
              mac_address: macAddress,
              username: username,
            },
          }))
        }
        onCameraPasswordChange={(macAddress, password) =>
          setCandidate((prev) => ({
            ...prev,
            data: {
              ...prev.data,
              mac_address: macAddress,
              password: password,
            },
          }))
        }
      />
    </Container>
  );
}

export const DefaultDevicesPage: Story = {
  render: () => <WrappedCameraRegistrationItemMobile />,
};
