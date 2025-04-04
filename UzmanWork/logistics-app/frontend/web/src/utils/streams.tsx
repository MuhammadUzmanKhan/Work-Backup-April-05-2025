import { CameraGroupWithLocations } from "coram-common-utils";

export function filterCameraGroupsByLocation(
  location_id: number | undefined,
  groups: CameraGroupWithLocations[]
): Map<number, CameraGroupWithLocations> {
  if (!location_id) return new Map();
  const filteredCameraGroups = groups.filter((group) =>
    group.location_ids.includes(location_id)
  );
  return new Map(filteredCameraGroups.map((group) => [group.id, group]));
}
