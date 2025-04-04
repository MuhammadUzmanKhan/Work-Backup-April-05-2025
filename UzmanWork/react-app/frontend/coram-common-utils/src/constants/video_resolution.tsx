import { VideoResRequestType } from "../backend_client";
import { getStaticResolutionConfig } from "../utils/video_resolution";

export const LOW_RESOLUTION_CONFIG = getStaticResolutionConfig(
  VideoResRequestType.LOW
);

export const HIGH_RESOLUTION_CONFIG = getStaticResolutionConfig(
  VideoResRequestType.HIGH
);
