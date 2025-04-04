import { useQuery } from "react-query";
import { CameraResponse, CamerasService, NVRResponse } from "../backend_client";
import { useMemo } from "react";
import { Duration } from "luxon";
import { CAMERAS_QUERY_KEY } from "../constants";
import { isDefined } from "../types";

const EMPTY_STREAMS: CameraResponse[] = [];

interface UseStreamsParams {
  locationId?: number | null;
  selectedNvr?: NVRResponse | undefined;
  excludeDisabled?: boolean;
  refetchOnMount?: boolean | "always";
  refetchOnWindowFocus?: boolean | "always";
  refetchInterval?: Duration;
}

export function useCamerasList({
  locationId = null,
  selectedNvr = undefined,
  excludeDisabled = false,
  refetchOnMount = true,
  refetchOnWindowFocus = true,
  refetchInterval = undefined,
}: UseStreamsParams) {
  const query = useQuery(
    [CAMERAS_QUERY_KEY, locationId, selectedNvr, excludeDisabled],
    async () => {
      const streams = await CamerasService.getCameras(
        selectedNvr?.uuid,
        locationId ?? undefined,
        excludeDisabled
      );
      return streams;
    },
    {
      refetchOnMount: refetchOnMount,
      refetchOnWindowFocus: refetchOnWindowFocus,
      refetchInterval: refetchInterval?.as("milliseconds"),
    }
  );
  return {
    ...query,
    data: query.data ?? EMPTY_STREAMS,
  };
}

export function useCamerasMap(params: UseStreamsParams) {
  const query = useCamerasList(params);
  const data = useMemo(() => {
    return query.data.reduce(
      (acc, camera) => acc.set(camera.camera.mac_address, camera),
      new Map<string, CameraResponse>()
    );
  }, [query.data]);
  return { ...query, data };
}

export function useCameraNames(params: UseStreamsParams) {
  const { data: cameras } = useCamerasList(params);

  return useMemo(() => {
    return cameras.reduce(
      (acc, camera) => acc.set(camera.camera.mac_address, camera.camera.name),
      new Map<string, string>()
    );
  }, [cameras]);
}

export function useCamerasTimezones(params: UseStreamsParams) {
  const { data: cameras } = useCamerasList(params);

  return useMemo(() => {
    return cameras.reduce(
      (acc, camera) => acc.set(camera.camera.mac_address, camera.timezone),
      new Map<string, string | undefined>()
    );
  }, [cameras]);
}

export function useCamerasByCameraGroupId({
  cameraGroupId,
  locationId,
}: {
  cameraGroupId?: number;
  locationId?: number;
}) {
  const cameraResponses = useCamerasList({
    locationId: locationId,
    excludeDisabled: true,
    refetchOnWindowFocus: false,
  }).data;
  if (!isDefined(cameraGroupId)) {
    return cameraResponses;
  }
  return cameraResponses.filter(
    (cameraResponse) => cameraResponse.camera.camera_group_id === cameraGroupId
  );
}
