import { Stack } from "@mui/material";
import { ThumbnailViewer } from "components/devices/cameras_table_cells/ThumbnailViewer";
import {
  CameraWithOnlineStatus,
  ThumbnailResponse,
  UserWallService,
  isDefined,
} from "coram-common-utils";
import { useNavigate } from "react-router-dom";
import { CameraSettingsInfoRecord } from "./components";
import { useConfirmDelete } from "utils/confirm";
import { useIsAdmin } from "components/layout/RoleGuards";
import { mapVendor } from "utils/camera_vendors";
import { useDeleteCamera, useUpdateCameraName } from "features/devices/hooks";
import { LoadingButton } from "@mui/lab";
import Grid from "@mui/material/Unstable_Grid2";
import { EditableTextField } from "components/common";

const DEFAULT_DELETE_CONFIRMATION_TEXT =
  "This action will remove all data associated with this camera including all clips, except those you have archived.";

interface CameraSettingsDrawerHeaderProps {
  camera: CameraWithOnlineStatus;
  thumbnail: ThumbnailResponse | undefined;
  onClose: VoidFunction;
}

export function CameraSettingsDrawerHeader({
  camera,
  thumbnail,
  onClose,
}: CameraSettingsDrawerHeaderProps) {
  const isAdmin = useIsAdmin();

  const navigate = useNavigate();

  const { isLoading: deleteCameraPending, mutateAsync: deleteCamera } =
    useDeleteCamera({ onSuccess: onClose });

  const { mutateAsync: updateCameraName } = useUpdateCameraName();

  const deleteCameraWithConfirmation = useConfirmDelete(() =>
    deleteCamera(camera.mac_address)
  );

  async function handleDeleteCamera() {
    const { walls_count } = await UserWallService.getWallsCountByCamera(
      camera.mac_address
    );

    const deleteConfirmationText =
      walls_count > 0
        ? `${DEFAULT_DELETE_CONFIRMATION_TEXT} This camera is currently used in ${walls_count} Wall(s).`
        : DEFAULT_DELETE_CONFIRMATION_TEXT;

    await deleteCameraWithConfirmation(deleteConfirmationText);
  }

  return (
    <Stack direction="row" alignItems="flex-start" gap={2}>
      <ThumbnailViewer
        macAddress={camera.mac_address}
        thumbnail={thumbnail}
        cameraIsOnline={camera.is_online}
        onClick={() => navigate(`/timeline/${camera.id}`)}
        height={160}
        width={260}
        sx={{
          backgroundColor: thumbnail ? "common.black" : "neutral.200",
          minWidth: 260,
        }}
      />
      <Stack alignItems="flex-end" flexGrow={1} overflow="hidden">
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          width="100%"
          gap={3}
        >
          <EditableTextField
            value={camera.name}
            onChange={(cameraName) =>
              updateCameraName({ cameraId: camera.id, cameraName })
            }
            variant="h2"
          />
          <LoadingButton
            variant="contained"
            color="error"
            onClick={handleDeleteCamera}
            loading={deleteCameraPending}
            disabled={!isAdmin}
            sx={{ width: "160px" }}
          >
            Delete Camera
          </LoadingButton>
        </Stack>
        <Grid container spacing={2} width="100%" py={2} pr={5} pl={1} m={0}>
          <Grid xs={2} pl={0}>
            <CameraSettingsInfoRecord
              primaryText="Vendor"
              secondaryText={mapVendor(camera.vendor)}
            />
          </Grid>
          <Grid xs={4}>
            <CameraSettingsInfoRecord
              primaryText="CVR ID"
              secondaryText={camera.nvr_uuid}
            />
          </Grid>
          <Grid xs={3}>
            <CameraSettingsInfoRecord
              primaryText="Mac Address"
              secondaryText={camera.mac_address}
            />
          </Grid>
          <Grid xs={3}>
            <CameraSettingsInfoRecord
              primaryText="IP Address"
              secondaryText={camera.ip}
            />
          </Grid>
          <Grid xs={2} pl={0}>
            <CameraSettingsInfoRecord
              primaryText="FPS"
              secondaryText={isDefined(camera.fps) ? String(camera.fps) : "N/A"}
            />
          </Grid>
          <Grid xs={4}>
            <CameraSettingsInfoRecord
              primaryText="Resolution"
              secondaryText={
                isDefined(camera.width) && isDefined(camera.height)
                  ? `${camera.width} x ${camera.height}`
                  : "N/A"
              }
            />
          </Grid>
          <Grid xs={3}>
            <CameraSettingsInfoRecord
              primaryText="Bit Rate"
              secondaryText={
                isDefined(camera.bitrate_kbps)
                  ? `${camera.bitrate_kbps} kbps`
                  : "N/A"
              }
            />
          </Grid>
          <Grid xs={3}>
            <CameraSettingsInfoRecord
              primaryText="Codec"
              secondaryText={camera.codec ?? "N/A"}
            />
          </Grid>
        </Grid>
      </Stack>
    </Stack>
  );
}
