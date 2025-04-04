import { Stack, styled, Typography } from "@mui/material";
import { useRef, useState } from "react";
import {
  CameraPipelineAlertCreate,
  CameraPipelineAlertType,
  CameraResponse,
  FeatureFlags,
  isDefined,
  DEFAULT_TIMEZONE,
} from "coram-common-utils";
import { useFeatureEnabled } from "utils/globals";
import { Alert, Circle } from "icons";
import { StatusCellPopover } from "./StatusCellPopover";
import { DateTime } from "luxon";
import { getCameraStatus } from "./utils";

interface StatusCellProps {
  camera: CameraResponse;
  cameraPipelineAlert: CameraPipelineAlertCreate | undefined;
}

export function StatusCell({ camera, cameraPipelineAlert }: StatusCellProps) {
  // State for popover
  const [open, setOpen] = useState(false);
  // Ref for popover anchor
  const anchorEl = useRef<HTMLElement>(null);
  // Only show detailed camera errors if feature flag is enabled
  // This way we expose these detailed errors only to devs.
  const showDetailedCameraErrorsEnabled = useFeatureEnabled(
    FeatureFlags.SHOW_DETAILED_CAMERA_ERRORS_ENABLED
  );
  const { isOnline, isOffline, isDisabled } = getCameraStatus(camera);
  // We want to expose certain camera errors to all users.
  const showDetailedCameraError =
    showDetailedCameraErrorsEnabled ||
    (isDefined(cameraPipelineAlert) &&
      (cameraPipelineAlert.alert_type ===
        CameraPipelineAlertType.PRODUCER_HIGH_FPS ||
        cameraPipelineAlert.alert_type ===
          CameraPipelineAlertType.CAMERA_DISCOVERY_FAILURE ||
        cameraPipelineAlert.alert_type ===
          CameraPipelineAlertType.PRODUCER_INVALID_CREDENTIALS ||
        cameraPipelineAlert.alert_type ===
          CameraPipelineAlertType.ONVIF_INVALID_CREDENTIALS));

  // Determine if we should show the camera alert
  const shouldShowCameraAlert =
    isDefined(cameraPipelineAlert) &&
    showDetailedCameraError &&
    camera.camera.is_enabled;

  let statusText = "";
  if (isOnline) {
    statusText = "Online";
  } else if (isOffline) {
    statusText = "Offline";
  } else if (isDisabled) {
    statusText = "Disabled";
  }

  // Determine status icon based on online status and alert status
  const statusIcon =
    (shouldShowCameraAlert && (
      <WarningIcon
        fontSize="small"
        cursor="pointer"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      />
    )) ||
    (isOffline && <OfflineIcon />) ||
    (isDisabled && <OfflineIcon />) ||
    (isOnline && <OnlineIcon />);

  const lastSeenTime = isOnline
    ? undefined
    : isDefined(camera.camera.last_seen_time)
    ? DateTime.fromISO(camera.camera.last_seen_time)
    : "Never";

  return (
    <Stack direction="row" alignItems="center" gap={1}>
      {statusIcon}
      <Typography ref={anchorEl} variant="body1">
        {statusText}
      </Typography>

      {(shouldShowCameraAlert || !isOnline) && (
        <StatusCellPopover
          open={open}
          anchorEl={anchorEl.current}
          showDetailedCameraErrorsEnabled={showDetailedCameraErrorsEnabled}
          shouldShowCameraAlert={shouldShowCameraAlert}
          alertType={cameraPipelineAlert?.alert_type}
          alertDetails={cameraPipelineAlert?.alert_details}
          lastSeenTime={lastSeenTime}
          timezone={camera.timezone ?? DEFAULT_TIMEZONE}
        />
      )}
    </Stack>
  );
}

export const OnlineIcon = styled(Circle)`
  height: 16px;
  width: 16px;
  color: ${({ theme }) => theme.palette.success.main};
`;

export const OfflineIcon = styled(OnlineIcon)`
  color: ${({ theme }) => theme.palette.grey.A400};
`;

const WarningIcon = styled(Alert)`
  height: 16px;
  width: 16px;
  color: ${({ theme }) => theme.palette.warning.main};
`;
