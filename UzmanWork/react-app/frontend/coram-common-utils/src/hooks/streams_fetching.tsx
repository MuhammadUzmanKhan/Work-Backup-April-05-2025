import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { QueryStatus, hashQueryKey, useQuery } from "react-query";
import {
  KinesisUrlSource,
  StreamResponse,
  isKinesisUrlFromHash,
  isKinesisSharedVideoClip,
  isKinesisUrlFromKioskHash,
  isArchivedKinesisVideoClipRequest,
  isDefined,
  isKinesisVideoClipRequest,
  OnStreamResponseFetchedFn,
  onKinesisUrlSourceRemoveFn,
  LiveStreamResponseData,
  isHlsStreamResponse,
} from "../types";
import {
  ArchivesService,
  CancelError,
  CancelablePromise,
  ClipRequestIdentifier,
  KinesisApiService,
  KioskPublicService,
  SharedVideosService,
} from "../backend_client";
import {
  adaptLegacyStreamData,
  isCameraOnlineFromSource,
  isCameraEnabledFromSource,
  getMacAddressFromKinesisUrlSource,
  isLiveStream,
} from "../utils/video";
import { Duration, DateTime } from "luxon";
import {
  getResolutionFromSource,
  getStaticResolutionConfig,
  handleRequestWithAbort,
} from "../utils";

interface InProgressKinesisRequest {
  requestPromise?:
    | CancelablePromise<string>
    | CancelablePromise<StreamResponse>
    | CancelablePromise<ClipRequestIdentifier>;
  clipIdentifier?: ClipRequestIdentifier;
}

async function fetchKinesisStreamResponse(
  kinesisUrlSource: KinesisUrlSource,
  inProgressKinesisRequest: InProgressKinesisRequest
): Promise<StreamResponse | undefined> {
  try {
    if (isKinesisUrlFromHash(kinesisUrlSource)) {
      if (isKinesisSharedVideoClip(kinesisUrlSource.sharedData)) {
        inProgressKinesisRequest.requestPromise =
          SharedVideosService.exchangeForUrl(kinesisUrlSource.uniqueHash);
      } else {
        inProgressKinesisRequest.requestPromise =
          SharedVideosService.exchangeForUrlLiveStreamWithConfig(
            kinesisUrlSource.uniqueHash,
            {
              resolution_config: kinesisUrlSource.resolutionConfig,
              prefer_webrtc: kinesisUrlSource.preferWebrtc,
            }
          );
      }
    } else if (isKinesisUrlFromKioskHash(kinesisUrlSource)) {
      inProgressKinesisRequest.requestPromise =
        KioskPublicService.retrieveKinesisLiveDataKiosk(
          kinesisUrlSource.kioskHash,
          kinesisUrlSource.kinesisOptions
        );
    } else if (isKinesisVideoClipRequest(kinesisUrlSource.kinesisOptions)) {
      const request = KinesisApiService.getKinesisClipUploadRequest(
        kinesisUrlSource.kinesisOptions
      );
      inProgressKinesisRequest.requestPromise = request;
      const clipRequestId = await request;
      inProgressKinesisRequest.clipIdentifier = clipRequestId;
      inProgressKinesisRequest.requestPromise =
        KinesisApiService.kinesisClipUrl(clipRequestId);
    } else if (
      isArchivedKinesisVideoClipRequest(kinesisUrlSource.kinesisOptions)
    ) {
      inProgressKinesisRequest.requestPromise =
        ArchivesService.retrieveArchiveClipUrl(kinesisUrlSource.kinesisOptions);
    } else {
      inProgressKinesisRequest.requestPromise =
        KinesisApiService.retrieveKinesisLiveStreamData(
          kinesisUrlSource.kinesisOptions
        );
    }
    const data = adaptLegacyStreamData(
      await inProgressKinesisRequest.requestPromise
    );
    return data;
  } catch (error) {
    if (error instanceof CancelError) {
      // This is not an error as we can cancel the request.
      return undefined;
    }
    console.error(`Error fetching kinesis video url: ${error}`);
    throw error;
  }
}

function cancelInProgressKinesisRequest(
  inProgressKinesisRequest: InProgressKinesisRequest
) {
  // If we have a pending request, cancel it.
  if (isDefined(inProgressKinesisRequest.requestPromise)) {
    inProgressKinesisRequest.requestPromise.cancel();
  }

  // If we have a pending clip upload, send an abort request.
  if (isDefined(inProgressKinesisRequest.clipIdentifier)) {
    KinesisApiService.abortKinesisClipUpload(
      inProgressKinesisRequest.clipIdentifier
    ).catch(() => {
      console.error("Failed to abort clip upload.");
    });
  }
}

export function useKinesisStreamResponse({
  kinesisUrlSource,
  isLiveStream,
  onError,
  onSuccess,
  onKinesisUrlSourceRemove,
}: {
  kinesisUrlSource: KinesisUrlSource;
  isLiveStream: boolean;
  onError?: (kinesisUrlSource: KinesisUrlSource) => void;
  onSuccess?: OnStreamResponseFetchedFn;
  onKinesisUrlSourceRemove?: onKinesisUrlSourceRemoveFn;
}) {
  const [streamResponse, setStreamResponse] = useState<
    StreamResponse | undefined
  >(undefined);
  const [status, setStatus] = useState<QueryStatus>("idle");
  // NOTE(@lberg): Get a stable reference to the kinesisUrlSource
  // using react-query stable key hashing.
  const kinesisUrlSourceJson = hashQueryKey([kinesisUrlSource]);

  const isOnline = isCameraOnlineFromSource(kinesisUrlSource);
  const isEnabled = isCameraEnabledFromSource(kinesisUrlSource);
  const canFetchData = (isOnline || !isLiveStream) && isEnabled;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const onKinesisUrlSourceRemoveRef = useRef(onKinesisUrlSourceRemove);
  onKinesisUrlSourceRemoveRef.current = onKinesisUrlSourceRemove;

  // Refetch when the kinesisUrlSource changes
  useEffect(() => {
    if (!canFetchData) {
      return;
    }
    const kinesisUrlSource = (
      JSON.parse(kinesisUrlSourceJson) as KinesisUrlSource[]
    )[0];

    setStatus("loading");
    const inProgressRequest: InProgressKinesisRequest = {};
    fetchKinesisStreamResponse(kinesisUrlSource, inProgressRequest)
      .then((data) => {
        setStreamResponse(data);
        onSuccessRef.current?.(kinesisUrlSource, data);
        setStatus("success");
      })
      .catch(() => {
        onErrorRef.current?.(kinesisUrlSource);
        setStatus("error");
      });

    return () => {
      setStatus("idle");
      setStreamResponse(undefined);
      cancelInProgressKinesisRequest(inProgressRequest);
      onKinesisUrlSourceRemoveRef.current?.(kinesisUrlSource);
    };
  }, [kinesisUrlSourceJson, canFetchData]);

  // Allow to refetch the stream url
  const refetchStreamUrl = useCallback(async () => {
    const kinesisUrlSource = (
      JSON.parse(kinesisUrlSourceJson) as KinesisUrlSource[]
    )[0];

    setStatus("idle");
    setStreamResponse(undefined);
    onKinesisUrlSourceRemoveRef.current?.(kinesisUrlSource);
    if (!canFetchData) {
      return;
    }

    setStatus("loading");
    try {
      const data = await fetchKinesisStreamResponse(kinesisUrlSource, {});
      setStreamResponse(data);
      onSuccessRef.current?.(kinesisUrlSource, data);
      setStatus("success");
    } catch (err) {
      onErrorRef.current?.(kinesisUrlSource);
      setStatus("error");
      throw err;
    }
  }, [kinesisUrlSourceJson, canFetchData]);

  return {
    streamResponse,
    isError: status === "error",
    isFetching: status === "loading" || status === "idle",
    status,
    isOffline: !isOnline,
    isDisabled: !isEnabled,
    refetchStreamUrl,
  };
}

type KeepLiveVideoAliveFn = (
  hlsResponses: [string, LiveStreamResponseData][]
) => CancelablePromise<void>;

function defaultKeepAliveFn(
  hlsResponses: [string, LiveStreamResponseData][]
): CancelablePromise<void> {
  return KinesisApiService.requestLive(
    hlsResponses.map(([macAddress, response]) => ({
      mac_address: macAddress,
      resolution_config: response.resolutionConfig,
    }))
  );
}

// Keep the live video alive by requesting it periodically.
export function useKeepLiveVideosAlive(
  liveResponsesMap: Map<string, LiveStreamResponseData>,
  {
    enabled,
    keepAliveFn = defaultKeepAliveFn,
  }: {
    enabled: boolean;
    keepAliveFn?: KeepLiveVideoAliveFn;
  }
) {
  // we only want to keep alive the live streams if they are hls
  // webrtc are kept alive even without an explicit request
  const hlsResponses = useMemo(
    () =>
      Array.from(liveResponsesMap.entries()).filter(([, response]) =>
        isHlsStreamResponse(response)
      ),
    [liveResponsesMap]
  );

  return useQuery(
    ["request_live", liveResponsesMap],
    async ({ signal }) => {
      console.debug(
        `Requesting keepAlive at ${DateTime.now().toISO()} for ${JSON.stringify(
          hlsResponses
        )}`
      );
      await handleRequestWithAbort(keepAliveFn(hlsResponses), signal);
    },
    {
      enabled: enabled && hlsResponses.length > 0,
      staleTime: 0,
      cacheTime: 1000,
      refetchOnWindowFocus: "always",
      refetchOnMount: "always",
      refetchOnReconnect: "always",
      refetchInterval: Duration.fromObject({ seconds: 1 }).as("milliseconds"),
    }
  );
}

// Store a map of live stream responses and update it when new responses are fetched.
export function useStoreLiveStreamResponses() {
  const [liveResponsesMap, setResponsesMap] = useState(
    new Map<string, LiveStreamResponseData>()
  );

  const addLiveStreamResponse: OnStreamResponseFetchedFn = useCallback(
    (kinesisUrlSource: KinesisUrlSource, data?: StreamResponse) => {
      if (!data) {
        return;
      }
      const macAddress = getMacAddressFromKinesisUrlSource(kinesisUrlSource);

      if (!isLiveStream(kinesisUrlSource)) {
        // remove old live data if any
        setResponsesMap((prevResponsesMap) => {
          const newResponsesMap = new Map(prevResponsesMap);
          newResponsesMap.delete(macAddress);
          return newResponsesMap;
        });
        return;
      }
      // add the new live data
      setResponsesMap((prevResponsesMap) => {
        const newResponsesMap = new Map(prevResponsesMap);
        const resolution = getResolutionFromSource(kinesisUrlSource);
        newResponsesMap.set(macAddress, {
          ...data,
          resolutionConfig: getStaticResolutionConfig(resolution),
        });
        return newResponsesMap;
      });
    },
    []
  );

  const removeLiveStreamResponse = useCallback(
    (kinesisUrlSource: KinesisUrlSource) => {
      const macAddress = getMacAddressFromKinesisUrlSource(kinesisUrlSource);
      setResponsesMap((prevResponsesMap) => {
        const newResponsesMap = new Map(prevResponsesMap);
        newResponsesMap.delete(macAddress);
        return newResponsesMap;
      });
    },
    []
  );

  return {
    liveResponsesMap,
    addLiveStreamResponse,
    removeLiveStreamResponse,
  };
}
