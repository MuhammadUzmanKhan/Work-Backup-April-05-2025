import { CameraResponse } from "coram-common-utils";
import { ALL_TENANTS_FILTER_OPTION } from "./consts";

export function filterCamerasByTenantAndSearchQuery(
  sortedCameras: CameraResponse[],
  selectedTenant: {
    label: string;
    id: string;
  },
  searchQuery: string
) {
  return sortedCameras.filter(
    (camera) =>
      (selectedTenant === ALL_TENANTS_FILTER_OPTION ||
        camera.camera.tenant === selectedTenant.id) &&
      (searchQuery.length === 0 ||
        camera.nvr_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        camera.camera.vendor
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (searchQuery.toLowerCase() === "online" && camera.camera.is_online) ||
        (searchQuery.toLowerCase() === "offline" && !camera.camera.is_online) ||
        camera.camera.ip.toLowerCase().includes(searchQuery.toLowerCase()) ||
        camera.camera.mac_address
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        camera.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        camera.camera.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(camera.camera.fps ?? "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        camera.org_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );
}
