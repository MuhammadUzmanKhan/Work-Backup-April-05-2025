import {
  OrganizationsService,
  NetworkScanSettingsResponse,
} from "coram-common-utils";
import { NotificationContext } from "contexts/notification_context";
import { useContext } from "react";
import { useQuery, useQueryClient, useMutation } from "react-query";
import { NetworkScanSettings } from "./types";
import { DEFAULT_NETWORK_SCAN_SETTINGS } from "./constants";

const NETWORK_SCAN_KEY = "networkScanMode";

export function useNetworkScanSettings({
  onSuccess,
}: {
  onSuccess: (data: NetworkScanSettings) => void;
}) {
  const query = useQuery(
    [NETWORK_SCAN_KEY],
    async () => {
      return (await OrganizationsService.retrieveNetworkScanSettings())
        .network_scan_settings;
    },
    {
      refetchOnWindowFocus: false,
      onSuccess: (data) => onSuccess(data),
    }
  );
  return { ...query, data: query.data ?? DEFAULT_NETWORK_SCAN_SETTINGS };
}

export function useMutateNetworkScanSettings() {
  const { setNotificationData } = useContext(NotificationContext);
  const queryClient = useQueryClient();

  return useMutation(
    async (mode: NetworkScanSettingsResponse) => {
      await OrganizationsService.updateNetworkScanSettings(mode);
      setNotificationData({
        message: "Network scan settings updated",
        severity: "success",
      });
      queryClient.invalidateQueries([NETWORK_SCAN_KEY]);
    },
    {
      onError: () => {
        setNotificationData({
          message: "Failed to update network scan settings",
          severity: "error",
        });
      },
    }
  );
}
