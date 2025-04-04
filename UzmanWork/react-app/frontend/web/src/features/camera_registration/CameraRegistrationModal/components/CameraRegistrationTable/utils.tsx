import { CandidateCamera } from "../../../types";
import { Order } from "utils/sortable";
import { CamerasTableSortKeys } from "./CameraRegistrationTable";
import { mapVendor } from "utils/camera_vendors";

export function sortCandidateCameras(
  candidates: CandidateCamera[],
  order: Order,
  orderBy: CamerasTableSortKeys
) {
  return candidates.sort((a, b) => {
    switch (orderBy) {
      case "vendor":
        if (order === "asc") {
          return mapVendor(a.data.vendor) > mapVendor(b.data.vendor) ? 1 : -1;
        }
        return mapVendor(a.data.vendor) > mapVendor(b.data.vendor) ? -1 : 1;
      case "ip":
        if (order === "asc") {
          return a.data.ip > b.data.ip ? 1 : -1;
        }
        return a.data.ip > b.data.ip ? -1 : 1;
      case "mac_address":
        if (order === "asc") {
          return a.data.mac_address > b.data.mac_address ? 1 : -1;
        }
        return a.data.mac_address > b.data.mac_address ? -1 : 1;
    }
  });
}
