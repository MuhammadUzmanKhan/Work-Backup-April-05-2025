import type { Meta, StoryObj } from "@storybook/react";
import { CameraRegistrationTable } from "../components/CameraRegistrationTable/CameraRegistrationTable";
import { useState } from "react";
import { randomCameraCandidatesData } from "stories/utils_stories";

const meta: Meta<typeof CameraRegistrationTable> = {
  title: "Camera Registration/CameraRegistrationTable",
  component: CameraRegistrationTable,
  tags: ["autodocs"],
};

const CANDIDATES_DATA = randomCameraCandidatesData(15);

function WrappedCameraRegistrationTable() {
  const [candidates, setCandidates] = useState(() =>
    CANDIDATES_DATA.map((data, idx) => ({ data, selected: false, idx }))
  );
  function onCameraToggle(macAddress: string) {
    setCandidates(
      candidates.map((candidate) => {
        if (candidate.data.mac_address === macAddress) {
          return {
            ...candidate,
            selected: !candidate.selected,
          };
        }
        return candidate;
      })
    );
  }
  function onAllCamerasToggle(selected: boolean) {
    setCandidates(
      candidates.map((candidate) => ({
        ...candidate,
        selected,
      }))
    );
  }
  return (
    <CameraRegistrationTable
      candidateCameras={candidates}
      onCameraToggle={onCameraToggle}
      onAllCamerasToggle={onAllCamerasToggle}
      setCandidateCameras={setCandidates}
    />
  );
}

export default meta;
type Story = StoryObj<typeof CameraRegistrationTable>;

export const ShowCandidates: Story = {
  render: WrappedCameraRegistrationTable,
};
