import { OrganizationContext } from "coram-common-utils/src/context/organization";
import { useSelectedOrganization } from "coram-common-utils/src/hooks/organizations";
import {
  getOrganizationIdInStorage,
  setOrganizationIdInStorage,
} from "./utils";
import { View } from "react-native";
import { Spinner } from "@gluestack-ui/themed";
import { isDefined } from "coram-common-utils/src/types/utils";
import { Redirect } from "expo-router";

// Component to require an organization.
// It will render nothing while loading,
// redirect to 403 if the user is not part of any organization,
// and render nothing until the organization is fetched.
export function RequireOrg({ children }: { children: React.ReactNode }) {
  const { organization, refetchOrganizations, isInitializedOrg } =
    useSelectedOrganization({
      setOrganizationIdInStorage,
      getOrganizationIdInStorage,
    });

  if (!isInitializedOrg) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spinner size="large" />
      </View>
    );
  }

  if (!isDefined(organization)) {
    return <Redirect href="/forbidden" />;
  }

  // TODO(@lberg): Implement UserActivityTracker for mobile
  return (
    <OrganizationContext.Provider
      value={{
        organization,
        refetchOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}
