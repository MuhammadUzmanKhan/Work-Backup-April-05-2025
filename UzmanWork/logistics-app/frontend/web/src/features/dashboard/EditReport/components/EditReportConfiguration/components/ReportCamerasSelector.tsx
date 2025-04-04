import { Stack, Typography } from "@mui/material";
import { CamerasSelector } from "components/common";
import {
  useCameraGroupsWithLocation,
  useCamerasList,
  useLocations,
} from "coram-common-utils";

interface ReportCamerasSelectorProps {
  selectedCamerasMacAddresses: string[];
  setSelectedCamerasMacAddresses: (macAddresses: string[]) => void;
}

export function ReportCamerasSelector({
  selectedCamerasMacAddresses,
  setSelectedCamerasMacAddresses,
}: ReportCamerasSelectorProps) {
  const { data: locations } = useLocations();
  const { data: cameraGroups } = useCameraGroupsWithLocation();

  const { data: cameras } = useCamerasList({
    excludeDisabled: false,
    refetchOnWindowFocus: false,
  });

  return (
    <Stack gap={1}>
      <Typography variant="body1" color="#83889E">
        Report cameras
      </Typography>
      <CamerasSelector
        selectedCamerasMacAddresses={selectedCamerasMacAddresses}
        setSelectedCamerasMacAddresses={async (cameras) =>
          setSelectedCamerasMacAddresses(cameras)
        }
        availableCameras={cameras ?? []}
        cameraGroups={[...cameraGroups.values()]}
        locations={[...locations.values()]}
      />
    </Stack>
  );
}
