import { useQuery } from "react-query";
import {
  KioskPublicService,
  PublicCameraData,
  StaticResolutionConfig,
  VersioningService,
} from "coram-common-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DateTime, Duration } from "luxon";
import { useSearchParams } from "utils/search_params";
import { handleRequestWithAbort } from "utils/error_handling";

const CHECK_REQUIRE_UPDATE_INTERVAL = Duration.fromObject({ minutes: 5 });

export function useKeepKioskNextWallAlive(
  kioskHash: string,
  wallId: number,
  cameras: PublicCameraData[],
  resolutionConfig: StaticResolutionConfig,
  enabled: boolean
) {
  // we only want to keep alive the live streams if they are hls
  // webrtc are kept alive even without an explicit request
  const hlsResponses = useMemo(
    () => cameras.filter((camera) => !camera.is_webrtc_enabled),
    [cameras]
  );
  return useQuery(
    ["kiosk_keep_alive", wallId, resolutionConfig],
    async ({ signal }) => {
      const keepAliveRequest = {
        wall_id: wallId,
        resolution_config: resolutionConfig,
        mac_addresses: hlsResponses.map((camera) => camera.mac_address),
      };
      await handleRequestWithAbort(
        KioskPublicService.keepWallAlive(kioskHash, keepAliveRequest),
        signal
      );
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

// Fetch information about a kiosk.
export function useKioskAndInitialWall(
  kioskHash: string,
  resolutionConfig: StaticResolutionConfig,
  refetchInterval: number
) {
  const kioskQuery = useQuery(
    ["kiosk", kioskHash],
    async () => {
      return await KioskPublicService.publicKioskRetrieve(kioskHash);
    },
    {
      refetchOnWindowFocus: false,
      retry: false,
      refetchInterval: refetchInterval,
    }
  );
  const kioskInitialWallQuery = useQuery(
    ["kiosk_initial_wall", kioskHash, resolutionConfig],
    async () => {
      return await KioskPublicService.publicKioskNextWall(kioskHash, {
        current_wall_id: undefined,
        resolution_config: resolutionConfig,
      });
    },
    {
      refetchOnWindowFocus: false,
      retry: false,
      refetchInterval: refetchInterval,
    }
  );

  return {
    kiosk: kioskQuery.data,
    initialWall: kioskInitialWallQuery.data,
    isErrorKiosk: kioskQuery.isError,
    isErrorInitialWall: kioskInitialWallQuery.isError,
  };
}

export function useTrackTimeUntilNextWall(rotationFrequencyS: number) {
  const [rotateTimeLeftS, setRotateTimeLeftS] =
    useState<number>(rotationFrequencyS);

  // Reset the time left when the rotation frequency changes.
  useEffect(() => {
    setRotateTimeLeftS(rotationFrequencyS);
  }, [rotationFrequencyS]);

  // NOTE(@lberg): we want this to be a stable setter and not change when
  // rotationFrequencyS changes.
  const rotationFrequencySRef = useRef(rotationFrequencyS);
  rotationFrequencySRef.current = rotationFrequencyS;
  const resetTimeLeft = useCallback(() => {
    setRotateTimeLeftS(rotationFrequencySRef.current);
  }, []);

  // Every second, update the time left.
  useEffect(() => {
    const interval = setInterval(() => {
      setRotateTimeLeftS((timeLeftS) => (timeLeftS > 0 ? timeLeftS - 1 : 0));
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [setRotateTimeLeftS]);

  return {
    rotateTimeLeftS,
    resetTimeLeft,
  };
}

export enum RotatingKioskState {
  RequireNextKioskFetch,
  RequireNextKioskRender,
}

export function useReloadOnOutdatedKiosk() {
  const { setSearchParams } = useSearchParams();
  const mountedAt = useRef(DateTime.now());

  const { data: versionInfo } = useQuery(
    ["kiosk_version"],
    async () => {
      const data = await VersioningService.checkFrontendRequiresUpdate(
        import.meta.env.VITE_VERSION
      );
      if (data.requires_update) {
        console.debug(`Kiosk requires update: ${data}`);
      }
      return data;
    },
    {
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchInterval: CHECK_REQUIRE_UPDATE_INTERVAL.as("milliseconds"),
    }
  );
  useEffect(() => {
    // if we detect that the frontend version is outdated, reload the page
    // start doing that after a certain amount of time to avoid infinite reloads
    if (
      versionInfo?.requires_update &&
      DateTime.now().diff(mountedAt.current) > CHECK_REQUIRE_UPDATE_INTERVAL
    ) {
      // set the search params to trigger a full reload
      const currentTime = DateTime.now().toMillis();
      setSearchParams(
        (prev) => ({ ...prev, reload_time: String(currentTime) }),
        { replace: true }
      );
      window.location.reload();
    }
  }, [versionInfo, setSearchParams]);
}
