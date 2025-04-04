import { DevicesService } from "coram-common-utils";
import { NotificationContext } from "contexts/notification_context";
import { NVRS_QUERY_KEY } from "features/devices/consts";
import { useContext } from "react";
import { useMutation, useQueryClient } from "react-query";

export function useUpdateNvrLocation() {
  const { setNotificationData } = useContext(NotificationContext);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      nvrUuid,
      locationId,
    }: {
      nvrUuid: string;
      locationId: number;
    }) =>
      DevicesService.updateNvrLocation({
        nvr_uuid: nvrUuid,
        location_id: locationId,
      }),
    onError: (e) => {
      setNotificationData({
        message: "Failed to update NVR location",
        severity: "error",
      });
      console.error(e);
    },
    onSettled: () => queryClient.invalidateQueries([NVRS_QUERY_KEY]),
    onSuccess: () => {
      setNotificationData({
        message: "NVR location updated successfully!",
        severity: "success",
      });
    },
  });
}
