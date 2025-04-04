import { useCamerasMap } from "coram-common-utils";
import { useMemo } from "react";
import { AccessLogCameraInfoMap } from "./types";

export function useAccessLogCamerasInfoMap() {
  const { data } = useCamerasMap({ refetchOnWindowFocus: false });
  const camerasInfoMap = useMemo(() => {
    const cameraMap: AccessLogCameraInfoMap = new Map();
    data?.forEach((camera) => {
      cameraMap.set(camera.camera.mac_address, {
        name: camera.camera.name,
        id: camera.camera.id,
      });
    });
    return cameraMap;
  }, [data]);
  return camerasInfoMap;
}
