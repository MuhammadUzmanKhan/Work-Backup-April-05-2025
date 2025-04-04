import {
  DynamicResolutionConfig,
  HlsStreamResponse,
  KinesisArchivedVideoClipRequest as KinesisArchivedVideoClipRequestOrig,
  KinesisVideoClipRequest as KinesisVideoClipRequestOrig,
  KinesisVideoLiveRequest as KinesisVideoLiveRequestOrig,
  SharedLiveStreamResponse,
  SharedVideoResponse,
  StaticResolutionConfig,
  WebRtcStreamResponse,
} from "../backend_client";

export type RequestType = "live" | "archive" | "clip";

export interface KinesisVideoLiveRequest extends KinesisVideoLiveRequestOrig {
  requestType: "live";
}

export interface KinesisArchivedVideoClipRequest
  extends KinesisArchivedVideoClipRequestOrig {
  requestType: "archive";
}

export interface KinesisVideoClipRequest extends KinesisVideoClipRequestOrig {
  requestType: "clip";
}

export type KinesisVideoRequest =
  | KinesisVideoClipRequest
  | KinesisVideoLiveRequest
  | KinesisArchivedVideoClipRequest;

export function isArchivedKinesisVideoClipRequest(
  obj: KinesisVideoRequest
): obj is KinesisArchivedVideoClipRequest {
  return obj.requestType === "archive";
}

export function isKinesisVideoClipRequest(
  obj: KinesisVideoRequest
): obj is KinesisVideoClipRequest {
  return obj.requestType === "clip";
}

export function isKinesisLiveRequest(
  obj: KinesisVideoRequest
): obj is KinesisVideoLiveRequest {
  return obj.requestType === "live";
}

export type KinesisSharedResponse =
  | SharedVideoResponse
  | SharedLiveStreamResponse;

export function isKinesisSharedVideoClip(
  obj: KinesisSharedResponse
): obj is SharedVideoResponse {
  return "start_time" in obj && "end_time" in obj;
}

export function isKinesisSharedLiveStream(
  obj: KinesisSharedResponse
): obj is SharedLiveStreamResponse {
  return !isKinesisSharedVideoClip(obj);
}

export function isStaticResolutionConfig(
  obj: StaticResolutionConfig | DynamicResolutionConfig
): obj is StaticResolutionConfig {
  return "static_resolution" in obj;
}

interface KinesisUrlFromHash {
  uniqueHash: string;
  sharedData: KinesisSharedResponse;
  resolutionConfig: StaticResolutionConfig;
  preferWebrtc: boolean;
}

export interface PlayerCamera {
  mac_address: string;
  name: string;
  timezone?: string;
  is_enabled: boolean;
  is_online: boolean;
  is_webrtc_enabled: boolean;
}

export interface KinesisUrlFromStream {
  camera: PlayerCamera;
  kinesisOptions: KinesisVideoRequest;
}

export interface KinesisUrlFromKioskHash {
  kioskHash: string;
  camera: PlayerCamera;
  kinesisOptions: KinesisVideoLiveRequest;
}

export type KinesisUrlSource =
  | KinesisUrlFromHash
  | KinesisUrlFromStream
  | KinesisUrlFromKioskHash;

export function isKinesisUrlFromStream(
  source: KinesisUrlSource
): source is KinesisUrlFromStream {
  return (
    "camera" in source && "kinesisOptions" in source && !("kioskHash" in source)
  );
}

export function isKinesisUrlFromHash(
  source: KinesisUrlSource
): source is KinesisUrlFromHash {
  return (
    "sharedData" in source &&
    "uniqueHash" in source &&
    "resolutionConfig" in source
  );
}

export function isKinesisUrlFromKioskHash(
  source: KinesisUrlSource
): source is KinesisUrlFromKioskHash {
  return (
    "kioskHash" in source && "kinesisOptions" in source && "camera" in source
  );
}

export type StreamResponse = HlsStreamResponse | WebRtcStreamResponse;

export function isHlsStreamResponse(
  response: StreamResponse
): response is HlsStreamResponse {
  return response.protocol === HlsStreamResponse.protocol.HLS;
}

export function isWebRtcLiveData(
  response: StreamResponse
): response is WebRtcStreamResponse {
  return response.protocol === WebRtcStreamResponse.protocol.WEBRTC;
}

export type OnStreamResponseFetchedFn = (
  kinesisUrlSource: KinesisUrlSource,
  data?: StreamResponse
) => void;

export type onKinesisUrlSourceRemoveFn = (
  kinesisUrlSource: KinesisUrlSource
) => void;
