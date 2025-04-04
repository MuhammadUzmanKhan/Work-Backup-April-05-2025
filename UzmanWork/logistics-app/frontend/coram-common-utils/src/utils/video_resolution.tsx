import {
  VideoResRequestType,
  DynamicResolutionConfig,
  StaticResolutionConfig,
} from "../backend_client";
import {
  KinesisUrlSource,
  isKinesisUrlFromStream,
  isKinesisUrlFromKioskHash,
} from "../types";

export function getDynamicResolutionConfig(
  preferredResolution: VideoResRequestType
): DynamicResolutionConfig {
  return {
    preferred_resolution: preferredResolution,
  };
}

export function getStaticResolutionConfig(
  staticResolution: VideoResRequestType
): StaticResolutionConfig {
  return {
    static_resolution: staticResolution,
  };
}

function getResolutionFromConfig(
  resolutionConfig: StaticResolutionConfig | DynamicResolutionConfig
): VideoResRequestType {
  if ("static_resolution" in resolutionConfig) {
    return resolutionConfig.static_resolution;
  }
  return resolutionConfig.preferred_resolution;
}

export function getResolutionFromSource(
  kinesisUrlSource: KinesisUrlSource
): VideoResRequestType {
  return isKinesisUrlFromStream(kinesisUrlSource) ||
    isKinesisUrlFromKioskHash(kinesisUrlSource)
    ? getResolutionFromConfig(kinesisUrlSource.kinesisOptions.resolution_config)
    : getResolutionFromConfig(kinesisUrlSource.resolutionConfig);
}
