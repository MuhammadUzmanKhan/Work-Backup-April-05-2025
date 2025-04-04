import { useMutation, useQuery, useQueryClient } from "react-query";
import {
  CAMERAS_QUERY_KEY,
  CamerasService,
  DevicesService,
  LOCATIONS_QUERY_KEY,
  LocationCreate,
  UpdateLocationAddressRequest,
  UpdateLocationNameRequest,
} from "coram-common-utils";
import { parseCameraDowntimes, parseRecentCameraPipelineAlerts } from "./types";
import { useContext } from "react";
import { NotificationContext } from "contexts/notification_context";
import { TimeInterval } from "utils/time";
import { formatDateTime } from "utils/dates";

export function useRecentCameraPipelineAlerts(cameraMacAddress: string) {
  return useQuery(
    ["recent_camera_pipeline_alerts", cameraMacAddress],
    async () => {
      const alerts = await DevicesService.getRecentCameraPipelineAlerts(
        cameraMacAddress
      );
      return parseRecentCameraPipelineAlerts(alerts);
    },
    {
      refetchInterval: 10000,
    }
  );
}

export function useCameraDowntime(
  cameraId: number,
  timeInterval: TimeInterval
) {
  const query = useQuery(
    [
      "camera_downtime",
      cameraId,
      timeInterval.timeStart.toMillis(),
      timeInterval.timeEnd.toMillis(),
    ],
    async () => {
      const response = await CamerasService.getCameraDowntime(
        cameraId,
        formatDateTime(timeInterval.timeStart),
        formatDateTime(timeInterval.timeEnd)
      );
      return parseCameraDowntimes(response.downtimes);
    }
  );

  return {
    ...query,
    data: query.data ?? [],
  };
}

export function useUpdateCameraName() {
  const { setNotificationData } = useContext(NotificationContext);

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cameraId,
      cameraName,
    }: {
      cameraId: number;
      cameraName: string;
    }) => DevicesService.renameCamera(cameraId, cameraName),
    onSettled: () => queryClient.invalidateQueries([CAMERAS_QUERY_KEY]),
    onError: (e) => {
      setNotificationData({
        message: "Failed to update camera name. Please try again.",
        severity: "error",
      });
      console.error(e);
    },
  });
}

export function useDeleteCamera({
  onSuccess,
}: { onSuccess?: VoidFunction } = {}) {
  const { setNotificationData } = useContext(NotificationContext);

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (macAddress: string) =>
      DevicesService.deleteCamera({ mac_address: macAddress }),
    onSettled: () => queryClient.invalidateQueries([CAMERAS_QUERY_KEY]),
    onError: (e) => {
      setNotificationData({
        message: "Failed to delete camera. Please try again.",
        severity: "error",
      });
      console.error(e);
    },
    onSuccess: async () => {
      setNotificationData({
        message: "Camera deleted successfully!",
        severity: "success",
      });
      onSuccess?.();
    },
  });
}

export function useCreateLocation({
  onSuccess,
}: { onSuccess?: VoidFunction } = {}) {
  const { setNotificationData } = useContext(NotificationContext);

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newLocation: LocationCreate) =>
      DevicesService.createLocation(newLocation),
    onError: (e) => {
      setNotificationData({
        message: "Failed to create location. Please try again.",
        severity: "error",
      });
      console.error(e);
    },
    onSettled: () => queryClient.invalidateQueries([LOCATIONS_QUERY_KEY]),
    onSuccess: () => {
      setNotificationData({
        message: "Location created successfully!",
        severity: "success",
      });
      onSuccess?.();
    },
  });
}

export function useDeleteLocation({
  onSuccess,
}: { onSuccess?: VoidFunction } = {}) {
  const { setNotificationData } = useContext(NotificationContext);

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (locationId: number) =>
      DevicesService.deleteLocation(locationId),
    onError: (e) => {
      setNotificationData({
        message: "Failed to delete location. Please try again.",
        severity: "error",
      });
      console.error(e);
    },
    onSettled: () => queryClient.invalidateQueries([LOCATIONS_QUERY_KEY]),
    onSuccess: () => {
      setNotificationData({
        message: "Location deleted successfully!",
        severity: "success",
      });
      onSuccess?.();
    },
  });
}

export function useUpdateLocationName({
  onSuccess,
}: { onSuccess?: VoidFunction } = {}) {
  const { setNotificationData } = useContext(NotificationContext);

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateLocationNameRequest) =>
      DevicesService.updateLocationName(request),
    onError: (e) => {
      setNotificationData({
        message: "Failed to update location name. Please try again.",
        severity: "error",
      });
      console.error(e);
    },
    onSettled: () => queryClient.invalidateQueries([LOCATIONS_QUERY_KEY]),
    onSuccess: async () => {
      setNotificationData({
        message: "Location name updated successfully!",
        severity: "success",
      });
      onSuccess?.();
    },
  });
}

export function useUpdateLocationAddress({
  onSuccess,
}: { onSuccess?: VoidFunction } = {}) {
  const { setNotificationData } = useContext(NotificationContext);

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateLocationAddressRequest) =>
      DevicesService.updateLocationAddress(request),
    onError: (e) => {
      setNotificationData({
        message: "Failed to update location address. Please try again.",
        severity: "error",
      });
      console.error(e);
    },
    onSettled: () => queryClient.invalidateQueries([LOCATIONS_QUERY_KEY]),
    onSuccess: () => {
      setNotificationData({
        message: "Location address updated successfully!",
        severity: "success",
      });
      onSuccess?.();
    },
  });
}
