import { CameraGroupWithLocations } from "../backend_client";

export function filterCameraGroupsByLocation(
  location_id: number | undefined,
  groups: CameraGroupWithLocations[]
): CameraGroupWithLocations[] {
  if (!location_id) return [];
  const filteredCameraGroups = groups.filter((group) =>
    group.location_ids.includes(location_id)
  );
  return filteredCameraGroups;
}
