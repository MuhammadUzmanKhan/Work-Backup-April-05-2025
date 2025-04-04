import {
  CameraPipelineAlertType,
  DATE_WITH_TIME_AND_ZONE,
  DEFAULT_TIMEZONE,
} from "coram-common-utils";
import { DateTime } from "luxon";

export function getUserFacingDescription(
  alertType: CameraPipelineAlertType
): string {
  switch (alertType) {
    case CameraPipelineAlertType.CAMERA_DISCOVERY_FAILURE:
      return "The camera could not be detected on the network.";
    case CameraPipelineAlertType.ONVIF_CONNECTION_FAILED:
      return "Unable to connect to the camera using the ONVIF protocol. This could be due to network issues.";
    case CameraPipelineAlertType.ONVIF_INVALID_CREDENTIALS:
      return "The credentials for ONVIF access to the camera are invalid.";
    case CameraPipelineAlertType.ONVIF_OTHER_ERROR:
      return "An unspecified error occurred while communicating with the camera using ONVIF.";
    case CameraPipelineAlertType.ONVIF_TIMED_OUT:
      return "The ONVIF request to the camera timed out.";
    case CameraPipelineAlertType.PRODUCER_NO_PROFILE_FOUND:
      return "No compatible streaming profile was found for the camera.";
    case CameraPipelineAlertType.PRODUCER_CONNECTION_FAILED:
      return "Failed to establish a connection to the camera for streaming.";
    case CameraPipelineAlertType.PRODUCER_INVALID_CREDENTIALS:
      return "The credentials provided for RTSP streaming are incorrect.";
    case CameraPipelineAlertType.PRODUCER_RTSP_CONNECTION_ERROR:
      return "Encountered an error during the RTSP communication with the camera.";
    case CameraPipelineAlertType.PRODUCER_CAMERA_IDLE:
      return "The camera is connected but has not sent any frames for a while.";
    case CameraPipelineAlertType.PRODUCER_HIGH_FPS:
      return "The camera's frame rate is too high, which may lead to processing delays.";
  }
}

export function formatDateTime(time: DateTime, timezone: string | undefined) {
  return time
    .setZone(timezone ?? DEFAULT_TIMEZONE)
    .toFormat(DATE_WITH_TIME_AND_ZONE);
}
