import { Navigate, useLocation } from "react-router-dom";
import { UserActivityTracker } from "./layout/UserActivityTracker";
import { AbsolutelyCentered } from "./AbsolutelyCentered";
import { CircularProgress } from "@mui/material";
import {
  OrganizationContext,
  isDefined,
  useSelectedOrganization,
} from "coram-common-utils";
import {
  getOrganizationIdInStorage,
  setOrganizationIdInStorage,
} from "utils/local_storage";

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
  const location = useLocation();

  if (!isInitializedOrg) {
    return (
      <AbsolutelyCentered>
        <CircularProgress />
      </AbsolutelyCentered>
    );
  }

  if (!isDefined(organization)) {
    return <Navigate to="/403" state={{ from: location }} replace />;
  }

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        refetchOrganizations,
      }}
    >
      <UserActivityTracker>{children}</UserActivityTracker>
    </OrganizationContext.Provider>
  );
}
