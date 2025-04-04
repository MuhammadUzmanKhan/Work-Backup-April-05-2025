import { CameraGroupWithLocations, CameraResponse } from "coram-common-utils";
import { useMemo } from "react";
import { NestedSelectorItem } from "components/selector/GroupSelector";

const EMPTY_ITEMS = new Map<number, NestedSelectorItem>();
export function useCamerasAsNestedSelectorItems(streams: CameraResponse[]) {
  const cameraItems = useMemo(() => {
    return new Map(
      streams.map((stream) => [
        stream.camera.id,
        {
          id: stream.camera.id,
          name: stream.camera.name,
          groupIds: stream.camera.camera_group_id
            ? [stream.camera.camera_group_id]
            : undefined,
        },
      ])
    );
  }, [streams]);
  return cameraItems || EMPTY_ITEMS;
}

export function useCameraGroupsAsNestedSelectorItems(
  cameraGroups: Map<number, CameraGroupWithLocations>
) {
  const cameraGroupItems = useMemo(() => {
    return new Map(
      Array.from(cameraGroups.entries()).map(([groupId, cameraGroup]) => [
        groupId,
        {
          id: cameraGroup.id,
          name: cameraGroup.name,
          groupIds: cameraGroup.location_ids,
        },
      ])
    );
  }, [cameraGroups]);
  return cameraGroupItems || EMPTY_ITEMS;
}
