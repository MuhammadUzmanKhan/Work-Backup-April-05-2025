import {
  AccessLogsResponse,
  CameraGroup,
  CameraPipelineAlertResponse,
  CameraResponse,
  DefaultService,
  DetectionAggregatedRequest,
  DevicesService,
  FaceAlertProfileRequest,
  FaceAlertService,
  FeatureFlags,
  LicensePlateAlertService,
  MembersService,
  NotificationGroup,
  NotificationGroupsService,
  NVRResponse,
  OrganizationsService,
  PerceptionsService,
  ThumbnailResponse,
  ThumbnailService,
  UserAlertsService,
} from "coram-common-utils";
import { DateTime, Duration } from "luxon";
import { useCallback } from "react";
import { useQuery } from "react-query";
import { atom } from "recoil";
import { ClipTimeSyncData } from "./time";

import { NVRS_QUERY_KEY } from "features/devices/consts";

export const isSidebarOpenState = atom<boolean>({
  key: "isSidebarOpenState",
  default: false,
});

export const customHeaderState = atom<React.ReactNode | null>({
  key: "customHeaderState",
  default: null,
});

export const clipTimeSyncDataState = atom<ClipTimeSyncData | null>({
  key: "clipTimeSyncDataState",
  default: null,
});

export const shouldShowJourneyState = atom<boolean>({
  key: "shouldShowJourneyState",
  default: false,
});

export interface CarrierMetadata {
  label: string;
  dot: string;
}

export interface ShipperMetadata {
  label: string;
  prefix: string;
}

export interface PolyDrawerRectCoordinates {
  height: number;
  width: number;
  top: number;
  bottom: number;
  left: number;
  right: number;
}

const EMPTY_CAMERA_GROUPS = new Map<number, CameraGroup>();

export function useCameraGroups() {
  const query = useQuery(["groups_list"], async () => {
    const groups = await DefaultService.groups();
    return new Map<number, CameraGroup>(
      groups.map((group) => [group.id, group])
    );
  });
  return {
    ...query,
    data: query.data || EMPTY_CAMERA_GROUPS,
  };
}

export function useAlertSubscribers(org_tenant?: string) {
  const query = useQuery(
    ["user_alert_subscribers"],
    async () => {
      return await MembersService.listAlertSubscribers();
    },
    {
      placeholderData: useCallback(() => [], []),
      enabled: org_tenant !== undefined,
    }
  );
  return {
    ...query,
    data: query.data ?? [],
  };
}

export function useUserAlertSettings({
  cameraMacAddress = "",
  staleTime = undefined,
  refetchOnMount = true,
  refetchOnWindowFocus = true,
}: {
  cameraMacAddress?: string;
  staleTime?: number;
  refetchOnMount?: boolean | "always";
  refetchOnWindowFocus?: boolean | "always";
}) {
  return useQuery(
    ["user_alert_settings", cameraMacAddress, staleTime],
    async () => {
      const settings = await UserAlertsService.getAlerts(cameraMacAddress);
      return settings;
    },
    {
      retry: 3,
      placeholderData: useCallback(() => [], []),
      staleTime: staleTime,
      refetchOnMount: refetchOnMount,
      refetchOnWindowFocus: refetchOnWindowFocus,
    }
  );
}

export function useUserAlerts(setting_id?: number) {
  return useQuery(
    ["user_alerts", setting_id],
    async () => {
      if (!setting_id) return [];
      const alerts = await UserAlertsService.getUserAlerts(setting_id);
      return alerts;
    },
    {
      placeholderData: useCallback(() => [], []),
    }
  );
}

export function useCategoryAggregatedDetections(
  cameraResponse: CameraResponse | undefined,
  aggregationRequest: DetectionAggregatedRequest,
  timezone: string,
  enabled: boolean
) {
  // NOTE(@lberg): we cache based on day.
  const timeStartFormat = DateTime.fromISO(
    aggregationRequest.start_time
  ).toLocaleString(DateTime.DATE_SHORT);
  const timeEndFormat = DateTime.fromISO(
    aggregationRequest.end_time
  ).toLocaleString(DateTime.DATE_SHORT);
  const queryResult = useQuery(
    [
      "category_aggregated_detections",
      cameraResponse?.camera.mac_address,
      timeStartFormat,
      timeEndFormat,
      aggregationRequest.search_polys,
    ],
    async () => {
      if (cameraResponse === undefined) {
        return [];
      }
      const detections = await PerceptionsService.categoryAggregateDetections({
        aggregation_request: aggregationRequest,
        mac_address: cameraResponse.camera.mac_address,
      });

      // Update detections to use the timezone of the NVR
      // and include the camera
      return detections.map((detection) => {
        return {
          startTime: DateTime.fromISO(detection.start_time).setZone(timezone),
          endTime: DateTime.fromISO(detection.end_time).setZone(timezone),
          detectionType: detection.object_category,
          camera: cameraResponse,
        };
      });
    },
    {
      // Mark as stale if older than 1 minute
      staleTime: Duration.fromObject({ minutes: 1 }).as("milliseconds"),
      // If stale, remounting will fetch
      refetchOnMount: true,
      enabled: enabled,
    }
  );
  return {
    ...queryResult,
    data: queryResult.data || [],
  };
}

const EMPTY_NVRS: NVRResponse[] = [];

export function useNvrs({
  locationId,
  refetchInterval,
}: {
  locationId?: number;
  refetchInterval?: Duration;
}) {
  const query = useQuery(
    [NVRS_QUERY_KEY, locationId],
    async () => {
      const devices = await DevicesService.nvrs(locationId);
      return devices;
    },
    {
      refetchInterval: refetchInterval?.as("milliseconds"),
    }
  );
  return {
    ...query,
    data: query.data ?? EMPTY_NVRS,
  };
}

const EMPTY_MOST_RECENT_THUMBNAILS = new Map<string, ThumbnailResponse>();

export function useMostRecentThumbnails({
  camera_mac_addresses,
  enabled = true,
}: {
  camera_mac_addresses: string[];
  enabled?: boolean;
}) {
  const queryResult = useQuery(
    ["most_recent_thumbnails", camera_mac_addresses],
    async () => {
      const thumbnails = await ThumbnailService.retrieveMostRecentThumbnails(
        camera_mac_addresses
      );
      return new Map<string, ThumbnailResponse>(Object.entries(thumbnails));
    },
    {
      refetchInterval: Duration.fromObject({ seconds: 5 }).as("milliseconds"),
      enabled: enabled,
    }
  );

  return {
    ...queryResult,
    data: queryResult.data ?? EMPTY_MOST_RECENT_THUMBNAILS,
  };
}

export function useAccessLogs(params: {
  startTime: DateTime;
  endTime: DateTime;
}) {
  const EMPTY_LOGS = useCallback(() => new Array<AccessLogsResponse>(), []);
  const query = useQuery(
    ["access_logs", params.startTime, params.endTime],
    async () => {
      return await OrganizationsService.getAccessLogs({
        start_time: params.startTime.toString(),
        end_time: params.endTime.toString(),
      });
    },
    {
      refetchOnWindowFocus: false,
    }
  );
  return {
    ...query,
    data: query.data ?? EMPTY_LOGS(),
  };
}

export const getVideoName = (
  location: string | undefined,
  groupName: string | undefined
) => {
  if (location && groupName) return `${location} - ${groupName}`;
};

const EMPTY_FEATURE_FLAGS: FeatureFlags[] = [];

function useFeatureFlags() {
  const query = useQuery(["feature_flags"], async () => {
    return await DefaultService.features();
  });
  return {
    ...query,
    data: query.data ?? EMPTY_FEATURE_FLAGS,
  };
}

export function useFeatureEnabled(feature: FeatureFlags) {
  const features = useFeatureFlags().data;
  return features.includes(feature);
}

const EMPTY_CAMERA_PIPELINE_ALERTS: CameraPipelineAlertResponse = {
  alerts_info: {},
};

export function useCameraPipelineAlerts({
  camera_mac_addresses,
}: {
  camera_mac_addresses: string[];
}) {
  const queryResult = useQuery(
    ["camera_pipeline_alerts", camera_mac_addresses],
    async () => {
      return await DevicesService.getCameraPipelineAlerts(camera_mac_addresses);
    },
    {
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchInterval: Duration.fromObject({ seconds: 5 }).as("milliseconds"),
    }
  );

  return {
    ...queryResult,
    data: queryResult.data ?? EMPTY_CAMERA_PIPELINE_ALERTS,
  };
}

export function useFaceAlertProfile(request: FaceAlertProfileRequest) {
  return useQuery(
    ["face_alert_profile", request],
    async () => {
      return await FaceAlertService.getAlertProfile(request);
    },
    {
      refetchOnWindowFocus: false,
    }
  );
}

export function useLicensePlateAlertProfileExists(licensePlateNumber: string) {
  return useQuery(
    ["license_plate_profile_exists", licensePlateNumber],
    async () => {
      return await LicensePlateAlertService.profileExists(licensePlateNumber);
    },
    {
      refetchOnWindowFocus: false,
    }
  );
}

const EMPTY_NOTIFICATION_GROUPS = new Map<number, NotificationGroup>();

export function useNotificationGroups() {
  const queryResult = useQuery(
    ["notification_groups"],
    async () => {
      const data = await NotificationGroupsService.notificationGroups();
      return new Map<number, NotificationGroup>(
        data.notification_groups.map((group) => [group.id, group])
      );
    },
    {
      refetchOnWindowFocus: false,
    }
  );
  return {
    ...queryResult,
    data: queryResult.data ?? EMPTY_NOTIFICATION_GROUPS,
  };
}

export function toPascalCase(input: string) {
  return input
    .split(/[_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
