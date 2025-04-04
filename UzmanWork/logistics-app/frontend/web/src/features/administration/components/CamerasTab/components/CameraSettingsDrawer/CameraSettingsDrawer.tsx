import { CameraResponse, isDefined } from "coram-common-utils";
import { DrawerWithHeader } from "components/common";
import { Typography } from "@mui/material";

interface CameraSettingsDrawerProps {
  camera: CameraResponse | null;
  refetchCameras: () => Promise<unknown>;
  onClose: VoidFunction;
}

export function CameraSettingsDrawer({
  camera,
  onClose,
}: CameraSettingsDrawerProps) {
  return (
    <DrawerWithHeader
      title={`${camera?.camera.name}`}
      open={Boolean(camera)}
      onClose={onClose}
      width="30rem"
    >
      {isDefined(camera) && <CameraSettingsDrawerBody />}
    </DrawerWithHeader>
  );
}

function CameraSettingsDrawerBody() {
  return <Typography variant="body1">Not Implemented yet</Typography>;
}
