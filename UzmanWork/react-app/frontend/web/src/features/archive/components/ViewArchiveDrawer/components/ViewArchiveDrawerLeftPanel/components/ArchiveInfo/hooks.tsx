import { useMutation } from "react-query";
import { useContext } from "react";
import { NotificationContext } from "contexts/notification_context";
import { ArchivesService } from "coram-common-utils/src/backend_client";

export function useUpdateArchiveTitle(onSettled: () => Promise<unknown>) {
  const { setNotificationData } = useContext(NotificationContext);

  return useMutation(
    async ({ archiveId, title }: { archiveId: number; title: string }) =>
      ArchivesService.updateArchiveTitle(archiveId, { title }),
    {
      onSettled,
      onError: (e) => {
        setNotificationData({
          message: `Failed to update archive title`,
          severity: "error",
        });
        console.error(e);
      },
    }
  );
}

export function useUpdateArchiveDescription(onSettled: () => Promise<unknown>) {
  const { setNotificationData } = useContext(NotificationContext);

  return useMutation(
    async ({
      archiveId,
      description,
    }: {
      archiveId: number;
      description: string;
    }) => ArchivesService.updateArchiveDescription(archiveId, { description }),
    {
      onSettled,
      onError: (e) => {
        setNotificationData({
          message: `Failed to update archive description`,
          severity: "error",
        });
        console.error(e);
      },
    }
  );
}
