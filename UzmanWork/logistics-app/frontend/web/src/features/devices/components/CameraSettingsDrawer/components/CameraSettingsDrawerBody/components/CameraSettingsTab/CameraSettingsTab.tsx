import {
  CameraFlag,
  CameraResponse,
  DevicesService,
  ExposedOrgFlags,
  FeatureFlags,
  OrgCamerasAudioSettings,
  OrgCamerasWebRTCSettings,
  isDefined,
  useOrganizationContext,
} from "coram-common-utils";
import { useOrgFlag } from "hooks/org_features";
import { useFeatureEnabled } from "utils/globals";
import {
  CameraOrientationUpdater,
  CredentialsUpdater,
  RtspUrlUpdater,
} from "./components";
import { useIsAdmin } from "components/layout/RoleGuards";
import Grid from "@mui/material/Unstable_Grid2";
import { Stack } from "@mui/material";
import { QueryObserverResult } from "react-query";
import { GenericSwitch } from "components/devices/cameras_table_cells/GenericSwitch";

interface CameraSettingsTabProps {
  camera: CameraResponse;
  refetchCameras: () => Promise<QueryObserverResult<CameraResponse[]>>;
}

export function CameraSettingsTab({
  camera,
  refetchCameras,
}: CameraSettingsTabProps) {
  const { organization } = useOrganizationContext();
  const isAdmin = useIsAdmin();
  const { data: lprEnabledForOrg } = useOrgFlag(
    ExposedOrgFlags.LICENSE_PLATE_RECOGNITION_ENABLED
  );
  const alwaysStreamingEnabled = useFeatureEnabled(
    FeatureFlags.ALWAYS_STREAMING_ENABLED
  );
  const cameraFaultySwitchEnabled = useFeatureEnabled(
    FeatureFlags.CAMERA_FAULTY_SWITCH_ENABLED
  );

  const canChangeCameraAudio =
    organization.cameras_audio_settings === OrgCamerasAudioSettings.MANUAL;

  const canChangeCameraWebRTC =
    organization.cameras_webrtc_settings === OrgCamerasWebRTCSettings.MANUAL;

  return (
    <Stack direction="row">
      <Grid xs={6} py={1.5} pr={4} minWidth="50%">
        <Stack gap={0.5}>
          {alwaysStreamingEnabled && (
            <GenericSwitch
              disabled={!isAdmin}
              callback={async (isAlwaysStreaming) =>
                await DevicesService.updateCameraFlag({
                  mac_address: camera.camera.mac_address,
                  flag_enum: CameraFlag.IS_ALWAYS_STREAMING,
                  flag_value: isAlwaysStreaming,
                })
              }
              onSuccessfulUpdate={refetchCameras}
              value={camera.camera.is_always_streaming}
              caption="Always Streaming"
              textProps={{ fontSize: "14px" }}
              sx={{ justifyContent: "space-between" }}
              switchProps={{ sx: { pr: 0, maxWidth: "50px" } }}
            />
          )}
          <GenericSwitch
            disabled={!isAdmin || !lprEnabledForOrg}
            callback={async (isTrackingLicensePlates) => {
              await DevicesService.updateCameraFlag({
                mac_address: camera.camera.mac_address,
                flag_enum: CameraFlag.IS_LICENSE_PLATE_DETECTION_ENABLED,
                flag_value: isTrackingLicensePlates,
              });
            }}
            onSuccessfulUpdate={refetchCameras}
            value={camera.camera.is_license_plate_detection_enabled}
            caption="License Plate Recognition"
            textProps={{ fontSize: "14px" }}
            tooltip={
              !lprEnabledForOrg
                ? "License Plate Recognition is disabled for your organization, please contact your administrator to enable it."
                : undefined
            }
            sx={{ justifyContent: "space-between" }}
            switchProps={{ sx: { pr: 0, maxWidth: "50px" } }}
          />

          <GenericSwitch
            disabled={!isAdmin || !canChangeCameraAudio}
            callback={async (isAudioEnabled) => {
              await DevicesService.updateCameraFlag({
                mac_address: camera.camera.mac_address,
                flag_enum: CameraFlag.IS_AUDIO_ENABLED,
                flag_value: isAudioEnabled,
              });
            }}
            onSuccessfulUpdate={refetchCameras}
            value={camera.camera.is_audio_enabled}
            caption="Audio"
            textProps={{ fontSize: "14px" }}
            tooltip={
              !canChangeCameraAudio
                ? "Camera audio editing is disabled for your organization, please contact your administrator to enable it."
                : undefined
            }
            sx={{ justifyContent: "space-between" }}
            switchProps={{ sx: { pr: 0, maxWidth: "50px" } }}
          />

          <GenericSwitch
            disabled={!isAdmin || !canChangeCameraWebRTC}
            callback={async (value) => {
              await DevicesService.updateCameraFlag({
                mac_address: camera.camera.mac_address,
                flag_enum: CameraFlag.IS_WEBRTC_ENABLED,
                flag_value: value,
              });
            }}
            onSuccessfulUpdate={refetchCameras}
            value={camera.camera.is_webrtc_enabled}
            caption="WebRTC Streaming"
            textProps={{ fontSize: "14px" }}
            tooltip={
              !canChangeCameraWebRTC
                ? "Camera webRTC editing is disabled for your organization, please contact your administrator to enable it."
                : undefined
            }
            sx={{ justifyContent: "space-between" }}
            switchProps={{ sx: { pr: 0, maxWidth: "50px" } }}
          />

          <GenericSwitch
            disabled={!isAdmin}
            callback={async (value) => {
              await DevicesService.updateCameraFlag({
                mac_address: camera.camera.mac_address,
                flag_enum: CameraFlag.IS_FORCE_FPS_ENABLED,
                flag_value: value,
              });
            }}
            onSuccessfulUpdate={refetchCameras}
            value={camera.camera.is_force_fps_enabled}
            caption="Set camera to 15 FPS"
            textProps={{ fontSize: "14px" }}
            sx={{ justifyContent: "space-between" }}
            switchProps={{ sx: { pr: 0, maxWidth: "50px" } }}
          />
          {cameraFaultySwitchEnabled && (
            <GenericSwitch
              disabled={!isAdmin}
              callback={async (isFaulty) => {
                await DevicesService.updateCameraFlag({
                  mac_address: camera.camera.mac_address,
                  flag_enum: CameraFlag.IS_FAULTY,
                  flag_value: isFaulty,
                });
              }}
              onSuccessfulUpdate={refetchCameras}
              value={camera.camera.is_faulty}
              caption="Faulty Camera"
              textProps={{ fontSize: "14px" }}
              sx={{ justifyContent: "space-between" }}
              switchProps={{ sx: { pr: 0, maxWidth: "50px" } }}
            />
          )}
          <CameraOrientationUpdater
            videoOrientationType={camera.camera.video_orientation_type}
            macAddress={camera.camera.mac_address}
            onSuccessfulUpdate={refetchCameras}
            stackProps={{ gap: 1 }}
            disabled={!isAdmin}
          />
        </Stack>
      </Grid>
      <Grid
        xs={6}
        minWidth="50%"
        display="flex"
        justifyContent="space-between"
        flexDirection="column"
        borderLeft="1px solid #E6EBF2"
        py={1.5}
        pl={4}
      >
        <CredentialsUpdater camera={camera} refetch={refetchCameras} />
        <RtspUrlUpdater
          macAddress={camera.camera.mac_address}
          rtspUrl={
            isDefined(camera.camera.enforced_rtsp_url)
              ? camera.camera.enforced_rtsp_url
              : undefined
          }
          onRtspUrlChange={() => refetchCameras()}
        />
      </Grid>
    </Stack>
  );
}
