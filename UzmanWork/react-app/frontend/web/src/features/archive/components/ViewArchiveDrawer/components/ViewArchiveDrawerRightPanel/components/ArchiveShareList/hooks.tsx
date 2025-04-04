import { useContext } from "react";
import { NotificationContext } from "contexts/notification_context";
import { useMutation } from "react-query";
import { ArchivesService } from "coram-common-utils/src/backend_client";

export function useUnshareArchive(onSettled: () => Promise<unknown>) {
  const { setNotificationData } = useContext(NotificationContext);

  return useMutation({
    mutationFn: ({ archiveId, email }: { archiveId: number; email: string }) =>
      ArchivesService.unshareArchive(archiveId, {
        email,
      }),
    onSettled,
    onError: (e) => {
      setNotificationData({
        message: "Failed to unshare the archive",
        severity: "error",
      });
      console.error(e);
    },
  });
}
