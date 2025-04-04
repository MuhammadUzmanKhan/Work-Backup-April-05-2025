import { darken, lighten } from "@mui/material";
import {
  CameraResponse,
  LicensePlateResponse,
  NVRResponse,
} from "coram-common-utils";
import { Order } from "utils/sortable";
import { LicensePlateTableSortKeys } from "components/analytics/license_plates/LicensePlateTab";
import { useCallback, useMemo } from "react";
import {
  useCameraPipelineAlerts,
  useMostRecentThumbnails,
} from "utils/globals";
import { CamerasTableSortKeys } from "./CamerasTable";
import { maxConsecutiveMatches, replaceForFuzzySearch } from "utils/text";
import { unparse } from "papaparse";
import { mapVendor } from "utils/camera_vendors";
import { formatDateTime } from "utils/dates";
import { DateTime, Duration } from "luxon";
import { ITEMS_PER_PAGE } from "./PaginationUtils";
import { CamerasSubTabOption } from "./CamerasSubTab";
import { TOOLBAR_HEIGHT_PX } from "components/navbar/navbar";
import { TABLE_HEADER_HEIGHT_PX } from "components/SortHeadCell";
import { SUB_TABS_BOX_HEIGHT_PX } from "components/analytics/CustomTabView";

export type NVRTableSortKeys = "location" | "status";

export const getBackgroundColor = (color: string, mode: string) =>
  mode == "dark" ? darken(color, 0.8) : lighten(color, 0.8);

export const TOTAL_TOP_HEIGHT =
  TOOLBAR_HEIGHT_PX + SUB_TABS_BOX_HEIGHT_PX + TABLE_HEADER_HEIGHT_PX;

export const REFETCH_INTERVAL = Duration.fromObject({ seconds: 5 });

export const wrapTextStyle = {
  width: "150px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const tableRowStyles = {
  "&:last-child td:first-child": {
    borderBottomLeftRadius: "8px",
  },
  "&:last-child td:last-child": {
    borderBottomRightRadius: "8px",
  },
};

export enum CameraStatusOption {
  Online = "online",
  Offline = "offline",
  Disabled = "disabled",
}

export interface CameraFilters {
  searchQuery: string;
  cameraStatus?: CameraStatusOption;
}

export interface NvrFilters {
  searchQuery: string;
  applianceOnline?: boolean;
}

export const DEFAULT_CAMERA_FILTERS: CameraFilters = {
  searchQuery: "",
  cameraStatus: undefined,
};

export const DEFAULT_NVR_FILTERS: NvrFilters = {
  searchQuery: "",
  applianceOnline: undefined,
};

export function getInitialNvrsSubTabsData(
  initialPage?: number,
  initialItemsPerPage?: number
) {
  const initialSubTabsPaginationData = {
    itemsPerPage: initialItemsPerPage || ITEMS_PER_PAGE[0],
    page: initialPage || 0,
  };
  return {
    All: initialSubTabsPaginationData,
    Online: initialSubTabsPaginationData,
    Offline: initialSubTabsPaginationData,
  };
}

enum CameraStatus {
  OfflineWithoutWarning = 1,
  OfflineWithWarning = 2,
  OnlineWithWarning = 3,
  OnlineWithoutWarning = 4,
}

export function useCameraRenderData(
  data: CameraResponse[],
  page: number,
  rows_per_page: number,
  order: Order,
  orderBy: CamerasTableSortKeys
) {
  const { data: mostRecentThumbnails } = useMostRecentThumbnails({
    camera_mac_addresses: data.map((stream) => stream.camera.mac_address),
  });

  const { data: cameraPipelineAlerts } = useCameraPipelineAlerts({
    camera_mac_addresses: data
      .map((stream) => stream.camera.mac_address)
      .sort(),
  });
  const getStatusOrder = useCallback(
    (camera: CameraResponse) => {
      const isOnline = camera.camera.is_online;
      const hasWarning =
        cameraPipelineAlerts.alerts_info[camera.camera.mac_address] != null;

      if (!isOnline && !hasWarning) return CameraStatus.OfflineWithoutWarning;
      if (!isOnline && hasWarning) return CameraStatus.OfflineWithWarning;
      if (isOnline && hasWarning) return CameraStatus.OnlineWithWarning;
      return CameraStatus.OnlineWithoutWarning;
    },
    [cameraPipelineAlerts.alerts_info]
  );
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      if (!a.camera || !b.camera) return 0;

      switch (orderBy) {
        case "name":
          if (order === "asc") {
            return a.camera.name > b.camera.name ? 1 : -1;
          }
          return a.camera.name > b.camera.name ? -1 : 1;
        case "location":
          if (order === "asc") {
            return (a.location ?? "") > (b.location ?? "") ? 1 : -1;
          }
          return (a.location ?? "") > (b.location ?? "") ? -1 : 1;
        case "group":
          if (order === "asc") {
            return (a.group_name ?? "") > (b.group_name ?? "") ? 1 : -1;
          }
          return (a.group_name ?? "") > (b.group_name ?? "") ? -1 : 1;
        case "status":
          return order === "asc"
            ? getStatusOrder(a) - getStatusOrder(b)
            : getStatusOrder(b) - getStatusOrder(a);

        case "activate":
          return order === "asc"
            ? (a.camera.is_enabled ? 1 : 0) - (b.camera.is_enabled ? 1 : 0)
            : (b.camera.is_enabled ? 1 : 0) - (a.camera.is_enabled ? 1 : 0);

        default: {
          const _exhaustiveCheck: never = orderBy;
          return _exhaustiveCheck;
        }
      }
    });
  }, [data, getStatusOrder, order, orderBy]);

  const visibleData = useMemo(
    () => sortedData.slice(page * rows_per_page, (page + 1) * rows_per_page),
    [sortedData, page, rows_per_page]
  );
  return { visibleData, mostRecentThumbnails, cameraPipelineAlerts };
}

export function sortNVRs(
  nvrs: NVRResponse[],
  orderBy: NVRTableSortKeys,
  order: "asc" | "desc"
) {
  return nvrs.sort((a, b) => {
    const locA = a.location_name ?? "";
    const locB = b.location_name ?? "";
    if (orderBy === "status") {
      if (a.is_online === b.is_online) {
        return order === "asc"
          ? locA.localeCompare(locB)
          : locB.localeCompare(locA);
      } else {
        return order === "asc" ? (a.is_online ? 1 : -1) : a.is_online ? -1 : 1;
      }
    } else if (orderBy === "location") {
      return order === "asc"
        ? locA.localeCompare(locB)
        : locB.localeCompare(locA);
    }
    return 0;
  });
}

export function useLicensePlateRenderData(
  data: Array<LicensePlateResponse>,
  page: number,
  rows_per_page: number,
  order: Order,
  orderBy: LicensePlateTableSortKeys,
  searchQuery: string
): Array<LicensePlateResponse> {
  const fuzzySearchQuery = replaceForFuzzySearch(searchQuery);
  const filteredData = data.filter((item) => {
    // Don't filter out data if the search query is empty
    if (fuzzySearchQuery.length === 0) {
      return true;
    }

    const fuzzyData = replaceForFuzzySearch(
      item.license_plate.license_plate_number
    );

    const maxNumMatches = maxConsecutiveMatches(fuzzyData, fuzzySearchQuery);
    const threshold = Math.min(2, fuzzySearchQuery.length);
    return maxNumMatches >= threshold;
  });

  // TODO(VAS-2785): Use new sort function
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      switch (orderBy) {
        case "plate":
          if (order === "asc") {
            return a.license_plate.license_plate_number >
              b.license_plate.license_plate_number
              ? 1
              : -1;
          }
          return a.license_plate.license_plate_number >
            b.license_plate.license_plate_number
            ? -1
            : 1;
        case "last_seen":
          if (order === "asc") {
            return a.license_plate.last_seen > b.license_plate.last_seen
              ? 1
              : -1;
          }
          return a.license_plate.last_seen > b.license_plate.last_seen ? -1 : 1;
        case "sightings":
          if (order === "asc") {
            return a.license_plate.num_occurrences >
              b.license_plate.num_occurrences
              ? 1
              : -1;
          }
          return a.license_plate.num_occurrences >
            b.license_plate.num_occurrences
            ? -1
            : 1;
        case "location":
          if (order === "asc") {
            return (a.license_plate.location_name ?? "") >
              (b.license_plate.location_name ?? "")
              ? 1
              : -1;
          }
          return (a.license_plate.location_name ?? "") >
            (b.license_plate.location_name ?? "")
            ? -1
            : 1;
        case "camera":
          if (order === "asc") {
            return (a.license_plate.camera_name ?? "") >
              (b.license_plate.camera_name ?? "")
              ? 1
              : -1;
          }
          return (a.license_plate.camera_name ?? "") >
            (b.license_plate.camera_name ?? "")
            ? -1
            : 1;
        case "search":
          return maxConsecutiveMatches(
            replaceForFuzzySearch(a.license_plate.license_plate_number),
            fuzzySearchQuery
          ) >
            maxConsecutiveMatches(
              replaceForFuzzySearch(b.license_plate.license_plate_number),
              fuzzySearchQuery
            )
            ? -1
            : 1;

        default: {
          const _exhaustiveCheck: never = orderBy;
          return _exhaustiveCheck;
        }
      }
    });
  }, [filteredData, fuzzySearchQuery, order, orderBy]);

  const visibleData = useMemo(
    () => sortedData.slice(page * rows_per_page, (page + 1) * rows_per_page),
    [sortedData, page, rows_per_page]
  );

  return visibleData;
}

export function getCameraDataCsv(cameras: CameraResponse[]) {
  const data = cameras.map((camera) => ({
    "Camera Name": camera.camera.name,
    "IP Address": camera.camera.ip,
    "Mac Address": camera.camera.mac_address,
    Vendor: mapVendor(camera.camera.vendor),
    Username: camera.camera.username,
    Password: camera.camera.password,
  }));
  return unparse(data, {
    delimiter: ",",
    header: true,
  });
}

export function getCameraDataCsvFileName() {
  return `Coram_AI_all_camers_report_${formatDateTime(DateTime.now())}`;
}

export function getNvrDataCsv(nvrs: NVRResponse[]) {
  const data = nvrs.map((nvr) => ({
    Name: nvr.uuid,
    Location: nvr.location_name,
    Address: nvr.address,
    "Retention Days": nvr.retention_days,
  }));
  return unparse(data, {
    delimiter: ",",
    header: true,
  });
}

export function getNvrDataCsvFileName() {
  return `Coram_AI_all_appliances_report_${formatDateTime(DateTime.now())}`;
}

export function getCameraStatus(
  subTabOption: CamerasSubTabOption
): CameraStatusOption | undefined {
  switch (subTabOption) {
    case CamerasSubTabOption.Online:
      return CameraStatusOption.Online;
    case CamerasSubTabOption.Offline:
      return CameraStatusOption.Offline;
    case CamerasSubTabOption.Disabled:
      return CameraStatusOption.Disabled;
    default:
      return undefined;
  }
}
