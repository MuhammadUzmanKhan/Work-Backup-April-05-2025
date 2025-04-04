import { AccessRestrictions, CameraResponse } from "coram-common-utils";
import {
  NestedSelectorGroup,
  NestedSelectionData,
} from "components/selector/GroupSelector";

export function cameraSelectionFromRestrictions(
  cameraGroups: Map<number, NestedSelectorGroup>,
  restrictions: AccessRestrictions
): Map<number, NestedSelectionData> {
  const cameraSelectionData = new Map<number, NestedSelectionData>();
  if (restrictions.full_access) {
    // If full access, select all camera groups and no cameras`.
    for (const group of cameraGroups.values()) {
      cameraSelectionData.set(group.id, {
        isGroupSelected: true,
        selectedItemIds: [],
      });
    }
    return cameraSelectionData;
  }

  // If not full access, select only the camera groups that are in the restrictions.
  for (const group of restrictions.camera_groups || []) {
    cameraSelectionData.set(group.camera_group_id, {
      isGroupSelected: true,
      selectedItemIds: [],
    });
  }

  return cameraSelectionData;
}

export function createSelectionFromMacAddresses(
  macAddresses: string[],
  availableStreams: CameraResponse[]
) {
  const cameraSelectionData = new Map();

  for (const macAddress of macAddresses) {
    const selectedStream = availableStreams.find(
      (stream) => stream.camera.mac_address === macAddress
    );

    if (selectedStream) {
      const groupId = selectedStream.camera.camera_group_id;
      const selectedCameraId = selectedStream.camera.id;

      if (!cameraSelectionData.has(groupId)) {
        cameraSelectionData.set(groupId, {
          isGroupSelected: false,
          selectedItemIds: [],
        });
      }

      const cameraGroupData = cameraSelectionData.get(groupId);

      if (
        cameraGroupData &&
        !cameraGroupData.selectedItemIds.includes(selectedCameraId)
      ) {
        cameraGroupData.selectedItemIds.push(selectedCameraId);
      }
    }
  }

  return cameraSelectionData;
}
