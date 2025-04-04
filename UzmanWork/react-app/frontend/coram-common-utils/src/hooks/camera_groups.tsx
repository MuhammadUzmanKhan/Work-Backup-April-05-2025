import { useQuery } from "react-query";
import { CameraGroupWithLocations, DefaultService } from "../backend_client";

const EMPTY_GROUPS = new Map<number, CameraGroupWithLocations>();

export function useCameraGroupsWithLocation(refetchOnWindowFocus = true) {
  const query = useQuery(
    ["groups_list_with_location"],
    async () => {
      const groups = await DefaultService.groupsWithLocation();
      return new Map<number, CameraGroupWithLocations>(
        groups.map((group) => [group.id, group])
      );
    },
    {
      refetchOnWindowFocus: refetchOnWindowFocus,
    }
  );
  return {
    ...query,
    data: query.data ?? EMPTY_GROUPS,
  };
}
