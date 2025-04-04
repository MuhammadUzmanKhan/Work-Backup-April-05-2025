import { useQuery } from "react-query";
import { AdminService } from "coram-common-utils";
import { useAuth0 } from "@auth0/auth0-react";

const ORGANISATIONS_ADMIN_QUERY_KEY = "organisations_admin";
const NVRS_ADMIN_QUERY_KEY = "nvrs_admin";
const CAMERAS_ADMIN_QUERY_KEY = "cameras_admin";

export function useOrganisationsAdmin() {
  const query = useQuery(
    [ORGANISATIONS_ADMIN_QUERY_KEY],
    async () => AdminService.getOrganisations(),
    {
      refetchInterval: 5000,
      refetchOnWindowFocus: false,
    }
  );
  return {
    ...query,
    data: query.data ?? [],
  };
}

export function useNVRsAdmin() {
  const query = useQuery(
    [NVRS_ADMIN_QUERY_KEY],
    async () => AdminService.getNvrs(),
    {
      refetchInterval: 5000,
      refetchOnWindowFocus: false,
    }
  );
  return {
    ...query,
    data: query.data ?? [],
  };
}

export function useCamerasAdmin() {
  const query = useQuery(
    [CAMERAS_ADMIN_QUERY_KEY],
    async () => AdminService.getCameras(),
    {
      refetchInterval: 10000,
      refetchOnWindowFocus: false,
    }
  );
  return {
    ...query,
    data: query.data ?? [],
  };
}

export function useIsUserDeviceManager() {
  const { user } = useAuth0();
  const deviceManagers = import.meta.env.VITE_DEVICES_MANAGERS_EMAILS;
  return deviceManagers === "ALL" || deviceManagers.includes(user?.email);
}
