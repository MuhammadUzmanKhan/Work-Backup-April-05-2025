import { CameraResponse, isDefined } from "coram-common-utils";

export function cameraMatchesFilters(
  camera: CameraResponse,
  searchQuery: string,
  locationFilter: number | undefined,
  groupFilter: number | undefined
) {
  const isLocationsFiltered =
    !isDefined(locationFilter) ||
    (isDefined(camera.location_id) && locationFilter === camera.location_id);

  const isGroupFiltered =
    !isDefined(groupFilter) ||
    (isDefined(camera.camera.camera_group_id) &&
      groupFilter === camera.camera.camera_group_id);

  const isInSearch =
    searchQuery === "" ||
    camera.camera.name.toLowerCase().includes(searchQuery) ||
    camera.camera.mac_address.toLowerCase().includes(searchQuery) ||
    camera.camera.ip.toLowerCase().includes(searchQuery);

  return isLocationsFiltered && isGroupFiltered && isInSearch;
}
