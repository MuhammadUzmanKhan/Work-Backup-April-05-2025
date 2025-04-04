import { createContext, useContext } from "react";
import { Organization } from "../backend_client";
import { isDefined } from "../types/utils";

export const OrganizationContext = createContext<
  | {
      organization: Organization;
      refetchOrganizations: () => void;
    }
  | undefined
>(undefined);

// Hook to get the organization from the context.
// Throws an error if the organization is not defined.
// This is intended to be used in components that require access to the current organization.
export function useOrganizationContext() {
  const organizationData = useContext(OrganizationContext);
  if (!isDefined(organizationData)) {
    throw new Error("Organization context is not defined upstream.");
  }
  return organizationData;
}
