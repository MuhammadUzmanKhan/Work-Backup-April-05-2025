import { CameraResponse, HlsStreamResponse } from "../backend_client";
import { DEFAULT_TIMEZONE } from "../constants/time";
import {
  isKinesisLiveRequest,
  isKinesisSharedLiveStream,
  isKinesisUrlFromHash,
  isKinesisUrlFromKioskHash,
  isKinesisUrlFromStream,
  KinesisUrlSource,
  PlayerCamera,
  StreamResponse,
} from "../types";

export function isCameraOnlineFromSource(
  kinesisUrlSource: KinesisUrlSource
): boolean {
  if (isKinesisUrlFromStream(kinesisUrlSource)) {
    return kinesisUrlSource.camera.is_online;
  }
  if (isKinesisUrlFromKioskHash(kinesisUrlSource)) {
    return kinesisUrlSource.camera.is_online;
  }
  // NOTE(@lberg): we are missing the FromHash case here, because it does not
  // have the info.
  // TODO(@lberg): add that info to the hash.
  return true;
}

export function isCameraEnabledFromSource(
  kinesisUrlSource: KinesisUrlSource
): boolean {
  if (isKinesisUrlFromStream(kinesisUrlSource)) {
    return kinesisUrlSource.camera.is_enabled;
  }
  if (isKinesisUrlFromKioskHash(kinesisUrlSource)) {
    return kinesisUrlSource.camera.is_enabled;
  }
  // NOTE: we are missing the FromHash case here, because it does not
  // have the info.
  return true;
}

export function isLiveStream(source: KinesisUrlSource): boolean {
  if (isKinesisUrlFromStream(source)) {
    return isKinesisLiveRequest(source.kinesisOptions);
  }
  if (isKinesisUrlFromKioskHash(source)) {
    return true;
  }
  if (isKinesisUrlFromHash(source)) {
    return isKinesisSharedLiveStream(source.sharedData);
  }
  return false;
}

export function getTimezoneFromCamera(
  camera: CameraResponse | PlayerCamera | undefined
): string {
  return camera?.timezone ?? DEFAULT_TIMEZONE;
}

export function getTimezoneFromKinesisUrlSource(
  kinesisUrlSource: KinesisUrlSource
) {
  if (isKinesisUrlFromHash(kinesisUrlSource)) {
    return kinesisUrlSource.sharedData.timezone ?? DEFAULT_TIMEZONE;
  }
  if (isKinesisUrlFromKioskHash(kinesisUrlSource)) {
    return getTimezoneFromCamera(kinesisUrlSource.camera);
  }
  if (isKinesisUrlFromStream(kinesisUrlSource)) {
    return getTimezoneFromCamera(kinesisUrlSource.camera);
  }
  console.error("Unknown kinesis url source", kinesisUrlSource);
  return DEFAULT_TIMEZONE;
}

export function getMacAddressFromKinesisUrlSource(
  kinesisUrlSource: KinesisUrlSource
): string {
  if (isKinesisUrlFromHash(kinesisUrlSource)) {
    return kinesisUrlSource.sharedData.mac_address;
  }
  if (isKinesisUrlFromKioskHash(kinesisUrlSource)) {
    return kinesisUrlSource.kinesisOptions.mac_address;
  }
  if (isKinesisUrlFromStream(kinesisUrlSource)) {
    return kinesisUrlSource.camera.mac_address;
  }
  const _exhaustiveCheck: never = kinesisUrlSource;
  console.error("Unknown kinesis url source", _exhaustiveCheck);
  return "";
}

export function adaptLegacyStreamData(
  data: string | StreamResponse
): StreamResponse {
  if (typeof data === "string") {
    return {
      data: {
        video_url: data,
      },
      protocol: HlsStreamResponse.protocol.HLS,
    };
  }
  return data;
}

export function getPlayerCamera(cameraResponse: CameraResponse): PlayerCamera {
  return {
    mac_address: cameraResponse.camera.mac_address,
    name: cameraResponse.camera.name,
    timezone: cameraResponse.timezone,
    is_enabled: cameraResponse.camera.is_enabled,
    is_online: cameraResponse.camera.is_online,
    is_webrtc_enabled: cameraResponse.camera.is_webrtc_enabled,
  };
}
