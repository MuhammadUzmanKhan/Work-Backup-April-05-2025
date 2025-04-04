import { FaceAlertResponse, CameraResponse } from "coram-common-utils";
import { Order } from "utils/sortable";
import { useMemo } from "react";

export type PersonOfInterestTableSortKeys =
  | "person"
  | "last_seen"
  | "location"
  | "camera";

export function usePersonOfInterestRenderData(
  cameras: Map<string, CameraResponse>,
  data: FaceAlertResponse[],
  page: number,
  rows_per_page: number,
  order: Order,
  orderBy: PersonOfInterestTableSortKeys
): FaceAlertResponse[] {
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      switch (orderBy) {
        case "person":
          if (order === "asc") {
            return a.face_profile_id > b.face_profile_id ? 1 : -1;
          }
          return a.face_profile_id > b.face_profile_id ? -1 : 1;
        case "last_seen":
          if (order === "asc") {
            return a.unique_face_occurrence.occurrence_time >
              b.unique_face_occurrence.occurrence_time
              ? 1
              : -1;
          }
          return a.unique_face_occurrence.occurrence_time >
            b.unique_face_occurrence.occurrence_time
            ? -1
            : 1;
        case "location": {
          const aLoc =
            cameras.get(a.unique_face_occurrence.mac_address)?.location ?? "";
          const bLoc =
            cameras.get(b.unique_face_occurrence.mac_address)?.location ?? "";
          if (order === "asc") {
            return aLoc > bLoc ? 1 : -1;
          }
          return aLoc > bLoc ? -1 : 1;
        }
        case "camera": {
          const aName =
            cameras.get(a.unique_face_occurrence.mac_address)?.camera.name ??
            "";
          const bName =
            cameras.get(b.unique_face_occurrence.mac_address)?.camera.name ??
            "";
          if (order === "asc") {
            return aName > bName ? 1 : -1;
          }
          return aName > bName ? -1 : 1;
        }
        default: {
          const _exhaustiveCheck: never = orderBy;
          return _exhaustiveCheck;
        }
      }
    });
  }, [data, order, orderBy, cameras]);

  const visibleData = useMemo(
    () => sortedData.slice(page * rows_per_page, (page + 1) * rows_per_page),
    [sortedData, page, rows_per_page]
  );
  return visibleData;
}
