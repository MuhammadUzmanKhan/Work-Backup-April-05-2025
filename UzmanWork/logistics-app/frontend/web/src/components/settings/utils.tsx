import {
  AccessRestrictions,
  Location,
  isDefined,
  MemberModel,
} from "coram-common-utils";
import {
  NestedSelectorGroup,
  NestedSelectionData,
} from "components/selector/GroupSelector";
import isMobilePhone from "validator/lib/isMobilePhone";
import isEmail from "validator/lib/isEmail";
import { MembersTableSortKeys } from "./MemberList";
import { DateTime } from "luxon";
export function restrictionsFromLocationData(
  availableLocations: Map<number, Location>,
  locationData?: Map<number, NestedSelectionData>
): AccessRestrictions {
  if (!locationData) {
    return { full_access: true };
  }

  const selectedLocationIds = Array.from(locationData.entries())
    .filter(([, locData]) => locData.isGroupSelected)
    .map(([locIdx]) => locIdx);

  if (selectedLocationIds.length === availableLocations.size) {
    // If all is selected, just return full_access, no specific locations / groups.
    return { full_access: true };
  }
  // Otherwise, indicates specific locations and groups.
  return {
    full_access: false,
    location_ids: selectedLocationIds,
    camera_groups: Array.from(locationData.entries())
      .filter(([, locData]) => !locData.isGroupSelected)
      .flatMap(([locIdx, locData]) =>
        locData.selectedItemIds.map((camGrpId) => ({
          camera_group_id: camGrpId,
          location_id: locIdx,
        }))
      ),
  };
}

export function sortMembersList(
  members: MemberModel[],
  orderBy: MembersTableSortKeys,
  order: "asc" | "desc"
) {
  const baseDate = DateTime.fromSeconds(0).toISO();

  return members.sort((member1, member2) => {
    if (orderBy === "role") {
      return order === "asc"
        ? member1.role.localeCompare(member2.role)
        : member2.role.localeCompare(member1.role);
    }
    return order === "asc"
      ? DateTime.fromISO(member1.last_login || baseDate).toMillis() -
          DateTime.fromISO(member2.last_login || baseDate).toMillis()
      : DateTime.fromISO(member2.last_login || baseDate).toMillis() -
          DateTime.fromISO(member1.last_login || baseDate).toMillis();
  });
}

export function locationSelectionFromRestrictions(
  availableLocations: Map<number, NestedSelectorGroup>,
  restrictions: AccessRestrictions
): Map<number, NestedSelectionData> {
  const locationData = new Map<number, NestedSelectionData>();
  if (restrictions.full_access) {
    // If full access, select all locations and no groups.
    for (const location of availableLocations.values()) {
      locationData.set(location.id, {
        isGroupSelected: true,
        selectedItemIds: [],
      });
    }
    return locationData;
  }

  for (const location_id of restrictions.location_ids || []) {
    locationData.set(Number(location_id), {
      isGroupSelected: true,
      selectedItemIds: [],
    });
  }
  // For groups, we create a locationData entry for each location that has
  // groups selected.
  // NOTE(@lberg): We are assuming that the location_ids in the restrictions
  // are not in location_ids.
  for (const camera_group of restrictions.camera_groups || []) {
    const locationDataGroup = locationData.get(
      Number(camera_group.location_id)
    ) || {
      isGroupSelected: false,
      selectedItemIds: [],
    };
    locationDataGroup.selectedItemIds.push(camera_group.camera_group_id);
    locationData.set(Number(camera_group.location_id), locationDataGroup);
  }

  return locationData;
}

export function isContactInfoValid(
  phoneNumber: string | undefined,
  emailAddress: string | undefined
) {
  const isPhoneNumberValid =
    isDefined(phoneNumber) &&
    isMobilePhone(phoneNumber.replace(/\s/g, ""), "any", {
      strictMode: true,
    });
  const isEmailValid = isDefined(emailAddress) && isEmail(emailAddress);
  return (
    (isPhoneNumberValid && isEmailValid) ||
    (isPhoneNumberValid && !isDefined(emailAddress)) ||
    (!isDefined(phoneNumber) && isEmailValid)
  );
}
