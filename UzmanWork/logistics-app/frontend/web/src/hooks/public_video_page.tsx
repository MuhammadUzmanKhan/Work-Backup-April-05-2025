import {
  SharedVideosService,
  StaticResolutionConfig,
} from "coram-common-utils";
import { Duration } from "luxon";
import { useQuery } from "react-query";

// Exchange the hash for a stream
export function useExchangeVideoHashForInfo(hash: string, isLive: boolean) {
  return useQuery(
    ["shared_video_info", hash, isLive],
    async () => {
      if (isLive) {
        return await SharedVideosService.retrieveSharedLiveStreamInfo(hash);
      }
      return await SharedVideosService.hashInfo(hash);
    },
    // We want this to happen only once in practice
    { refetchOnWindowFocus: false, staleTime: Infinity }
  );
}

export function useKeepSharedLiveStreamAlive(
  uniqueUuid: string,
  resolutionConfig: StaticResolutionConfig,
  enabled: boolean
) {
  return useQuery(
    ["request_shared_live_stream_live", uniqueUuid],
    async () =>
      await SharedVideosService.keepAliveSharedStream(uniqueUuid, {
        resolution_config: resolutionConfig,
      }),
    {
      staleTime: 0,
      cacheTime: 1000,
      enabled: enabled,
      refetchOnWindowFocus: "always",
      refetchOnMount: "always",
      refetchOnReconnect: "always",
      refetchInterval: Duration.fromObject({ seconds: 1 }).as("milliseconds"),
    }
  );
}
