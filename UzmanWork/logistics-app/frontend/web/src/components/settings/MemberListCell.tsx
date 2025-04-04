import {
  MemberModel,
  MembersService,
  UserRole,
  useCameraGroupsWithLocation,
  useLocations,
} from "coram-common-utils";
import { useState } from "react";
import { NestedSelector } from "components/selector/NestedSelector";
import { NestedSelectionData } from "components/selector/GroupSelector";
import { locationSelectionFromRestrictions } from "components/settings/utils";
import { restrictionsFromLocationData } from "./utils";
import { useCameraGroupsAsNestedSelectorItems } from "hooks/selector";

export const LOCATION_SELECTOR_STYLE = {
  minWidth: 150,
  color: "neutral.400",
  height: "2rem",
  display: "flex",
  justifyContent: "space-between",
  borderRadius: "0.2rem",
  borderColor: "neutral.200",
  paddingX: "0.7rem",
};

export interface MemberListCellProps {
  user: MemberModel;
  refetchMembers: () => void;
}

export function MemberListCell({ user, refetchMembers }: MemberListCellProps) {
  const { data: availableLocations, isFetched: isLocationsFetched } =
    useLocations();
  const { data: availableCameraGroups, isFetched: isCameraGroupFetched } =
    useCameraGroupsWithLocation();
  const availableCameraGroupItems = useCameraGroupsAsNestedSelectorItems(
    availableCameraGroups
  );

  // Keep a state of the selected locations initialized with the user's
  // access restrictions.
  const initialLocationSelections = locationSelectionFromRestrictions(
    availableLocations,
    user.access_restrictions || {}
  );
  const [selectedLocationsData, setSelectedLocationsData] = useState<
    Map<number, NestedSelectionData>
  >(initialLocationSelections);

  // Update the user's access restrictions when the selection changes.
  async function handleUpdateLocationGroup(
    user: MemberModel,
    selectedData: Map<number, NestedSelectionData>
  ) {
    await MembersService.updateUserAccessRestrictions({
      user_id: user.user_id,
      access_restrictions: restrictionsFromLocationData(
        availableLocations,
        selectedData
      ),
    });
    refetchMembers();
  }
  if (isCameraGroupFetched && isLocationsFetched) {
    return (
      <NestedSelector
        items={availableCameraGroupItems}
        groups={availableLocations}
        selectionData={selectedLocationsData}
        label={user.role === UserRole.ADMIN ? "All Cameras" : "Camera Access"}
        onChange={setSelectedLocationsData}
        onClick={async (locationData) =>
          await handleUpdateLocationGroup(user, locationData)
        }
        onClose={async (locationData) =>
          await handleUpdateLocationGroup(user, locationData)
        }
        displayDoneButton={true}
        disabled={user.role === UserRole.ADMIN}
        sx={{
          ...LOCATION_SELECTOR_STYLE,
        }}
        selectorProps={{
          color: user.role === UserRole.ADMIN ? "neutral.400" : "neutral.600",
        }}
      />
    );
  } else {
    return null;
  }
}
