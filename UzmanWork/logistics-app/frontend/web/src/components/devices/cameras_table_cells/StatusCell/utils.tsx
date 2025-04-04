import {
  CameraPipelineAlertType,
  CameraResponse,
  isDefined,
} from "coram-common-utils";

export const getCameraStatus = (stream: CameraResponse) => {
  const isOnline = stream.camera.is_online;
  const isOffline = !isOnline && stream.camera.is_enabled;
  const isDisabled = !isOnline && !stream.camera.is_enabled;

  return { isOnline, isOffline, isDisabled };
};

export function alertTypeToShow(
  alertType: CameraPipelineAlertType | undefined,
  showDetailedCameraErrorsEnabled: boolean
) {
  if (!isDefined(alertType)) {
    return "";
  } else if (alertType === CameraPipelineAlertType.PRODUCER_HIGH_FPS) {
    return "High Camera FPS Alert";
  } else if (alertType === CameraPipelineAlertType.CAMERA_DISCOVERY_FAILURE) {
    return "Camera Not Reachable";
  } else if (
    // Only show "pretty" camera errors if feature flag is not enabled
    !showDetailedCameraErrorsEnabled &&
    (alertType === CameraPipelineAlertType.PRODUCER_INVALID_CREDENTIALS ||
      alertType === CameraPipelineAlertType.ONVIF_INVALID_CREDENTIALS)
  ) {
    return "Invalid Username or Password";
  } else {
    return alertType;
  }
}
