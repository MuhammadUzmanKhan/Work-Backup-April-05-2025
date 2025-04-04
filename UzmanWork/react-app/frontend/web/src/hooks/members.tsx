import {
  MembersService,
  UserRole,
  Location,
  MemberModel,
  useLocations,
  useCameraGroupsWithLocation,
} from "coram-common-utils";
import { useState } from "react";
import { useCameraGroupsAsNestedSelectorItems } from "./selector";
import {
  locationSelectionFromRestrictions,
  restrictionsFromLocationData,
} from "components/settings/utils";
import { NestedSelectionData } from "components/selector/GroupSelector";
import { QueryObserverResult, useQuery } from "react-query";
import { Duration } from "luxon";
import { useTTLCache } from "utils/ttl_cache";

const FULL_ACCESS = { full_access: true };
const ORG_MEMBERS_REFETCH_INTERVAL = Duration.fromObject({ seconds: 10 });

export function useOrgMembers() {
  const query = useQuery(
    ["org_members"],
    async () => {
      return await MembersService.getMembersList();
    },
    {
      refetchOnWindowFocus: false,
      refetchInterval: ORG_MEMBERS_REFETCH_INTERVAL.as("milliseconds"),
    }
  );
  return {
    ...query,
    data: query.data ?? [],
  };
}

export function useHandleNestedSelector() {
  const { data: availableLocations, isFetched: isLocationsFetched } =
    useLocations();
  const { data: availableCameraGroups, isFetched: isCameraGroupFetched } =
    useCameraGroupsWithLocation();
  const availableCameraGroupItems = useCameraGroupsAsNestedSelectorItems(
    availableCameraGroups
  );
  const initialLocationSelections = locationSelectionFromRestrictions(
    availableLocations,
    FULL_ACCESS
  );
  const [selectedLocationsData, setSelectedLocationsData] = useState<
    Map<number, NestedSelectionData>
  >(initialLocationSelections);

  // Update the state when the selection changes.
  function handleUpdateLocationGroup(
    locationsData: Map<number, NestedSelectionData>
  ) {
    // Ensure we copy the entries, so changes to the original map don't affect the result.
    setSelectedLocationsData(
      new Map(
        Array.from(locationsData.entries()).map(([locId, locData]) => [
          locId,
          { ...locData },
        ])
      )
    );
  }

  return {
    selectedLocationsData,
    availableLocations,
    availableCameraGroupItems,
    fetched: isLocationsFetched && isCameraGroupFetched,
    handleUpdateLocationGroup,
  };
}

export type MemberAddFn = (
  emailInput: string,
  userRole: UserRole,
  selectedLocationsData: Map<number, NestedSelectionData>,
  availableLocations: Map<number, Location>,
  onError: (message: string) => void,
  onSuccess: (message: string) => void
) => Promise<void>;

// NOTE(@lberg): this hook is required because the provider doesn't immediately update the data.
// However, having a cache means that data might be stale. This is true especially if multiple
// users are editing members at the same time. As such, we use a TTL cache to ensure that the
// data is not stale for too long.
// NOTE(@lberg): Of all the actions, add is the only one which is not immediately reflected in the
// data. This is because we can't easily create a member from the response right now.
export function useMembersMutate(
  fetchedMembers: MemberModel[],
  refetchMembers: () => Promise<QueryObserverResult<MemberModel[]>>
) {
  const [isSubmitLoading, setIsSubmitLoading] = useState<boolean>(false);
  const { cache: removedMembersCache } = useTTLCache<string, boolean>(
    Duration.fromObject({ seconds: 15 })
  );
  const { cache: updatedRolesCache } = useTTLCache<string, UserRole>(
    Duration.fromObject({ seconds: 15 })
  );

  async function handleMemberRemove(userId: string, userEmail: string) {
    await MembersService.deleteMember({
      user_id: userId,
    });
    removedMembersCache.set(userEmail, true);
    await refetchMembers();
  }

  async function handleMemberAdd(
    emailInput: string,
    userRole: UserRole,
    selectedLocationsData: Map<number, NestedSelectionData>,
    availableLocations: Map<number, Location>,
    onError: (message: string) => void,
    onSuccess: (message: string) => void
  ) {
    if (isSubmitLoading) {
      return;
    }
    try {
      setIsSubmitLoading(true);
      await MembersService.createMember({
        email: emailInput,
        role: userRole,
        access_restrictions: restrictionsFromLocationData(
          availableLocations,
          selectedLocationsData
        ),
      });
      onSuccess("Member added successfully.");
      removedMembersCache.remove(emailInput);
      await refetchMembers();
    } catch (ex) {
      console.error(ex);
      onError("Something went wrong. Please try again later!");
    } finally {
      setIsSubmitLoading(false);
    }
  }

  async function handleMemberRoleEdit(user: MemberModel, userRole: UserRole) {
    await MembersService.updateUserRole({
      user_id: user.user_id,
      role: userRole,
    });
    updatedRolesCache.set(user.email, userRole);
    await refetchMembers();
  }

  const filteredMembers = fetchedMembers.reduce((acc, member) => {
    if (removedMembersCache.get(member.email) === true) {
      return acc;
    }
    const updatedRole = updatedRolesCache.get(member.email);
    if (updatedRole) {
      return [...acc, { ...member, role: updatedRole }];
    }
    return [...acc, member];
  }, [] as MemberModel[]);

  return {
    filteredMembers,
    handleMemberRemove,
    handleMemberAdd,
    handleMemberRoleEdit,
    isSubmitLoading,
  };
}
