import { DefaultService, OpenAPI, Organization } from "../backend_client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRecoilState } from "recoil";

import { isDefined } from "../types";
import { useQuery, useQueryClient } from "react-query";
import { selectedOrganization } from "../atoms";

const EMPTY_ORG_MAP = new Map<number, Organization>();

export function useOrganizations() {
  const query = useQuery(
    ["organizations_list"],
    async () => {
      const orgs = await DefaultService.organizations();
      return new Map<number, Organization>(
        orgs.map((org) => {
          return [org.id, org];
        })
      );
    },
    {
      staleTime: Infinity,
      refetchOnMount: false,
    }
  );
  return {
    ...query,
    data: query.data ?? EMPTY_ORG_MAP,
  };
}

// Hook to return the selected organization and a setter. Also returns the list of organizations.
// This is intended to be used in components that want to set the selected organization.
export function useSelectedOrganization({
  setOrganizationIdInStorage,
  getOrganizationIdInStorage,
}: {
  setOrganizationIdInStorage: (orgId: number) => Promise<void>;
  getOrganizationIdInStorage: () => Promise<number | null>;
}) {
  const {
    data: organizations,
    refetch: refetchOrganizations,
    isFetched: areOrganizationsFetched,
  } = useOrganizations();
  const queryClient = useQueryClient();
  const [organization, setOrganization] = useRecoilState(selectedOrganization);
  const [isInitializedOrg, setIsInitializedOrg] = useState(false);
  const organizationRef = useRef(organization);
  organizationRef.current = organization;

  const setOrganizationIdInStorageRef = useRef(setOrganizationIdInStorage);
  setOrganizationIdInStorageRef.current = setOrganizationIdInStorage;
  const getOrganizationIdInStorageRef = useRef(getOrganizationIdInStorage);
  getOrganizationIdInStorageRef.current = getOrganizationIdInStorage;

  const orgSetter = useCallback(
    (organization: Organization | null) => {
      // We might need to remove previous queries from a different organization.
      const shouldRemoveQueries =
        !isDefined(organization) ||
        !isDefined(organizationRef.current) ||
        organizationRef.current.id !== organization.id;

      OpenAPI.HEADERS = { "x-coram-org-tenant": organization?.tenant || "" };
      if (shouldRemoveQueries) {
        queryClient.removeQueries({
          predicate: (query) => query.queryKey[0] !== "organizations_list",
        });
      }
      setOrganization(organization);
      if (isDefined(organization)) {
        setOrganizationIdInStorageRef.current(organization.id);
      }
      setIsInitializedOrg(true);
    },
    [queryClient, setOrganization]
  );

  // Update the current organization if the list of organizations changes.
  // This will set the current org to the first org if we don't have one stored
  // in local storage.
  useEffect(() => {
    if (!areOrganizationsFetched) {
      return;
    }

    const firstOrg: Organization | null =
      organizations.values().next().value ?? null;

    getOrganizationIdInStorageRef.current().then((orgIdFromStorage) => {
      if (!isDefined(orgIdFromStorage)) {
        orgSetter(firstOrg);
        return;
      }
      // Set the org to either the one already stored
      // or the first one returned. If neither is found, set to null
      const orgFromStorage = organizations.get(orgIdFromStorage) ?? null;
      const orgToUse = isDefined(orgFromStorage) ? orgFromStorage : firstOrg;
      orgSetter(orgToUse);
    });
  }, [organizations, orgSetter, areOrganizationsFetched]);

  return {
    organization,
    setOrganization: orgSetter,
    organizations,
    refetchOrganizations,
    isInitializedOrg,
  };
}
