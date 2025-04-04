import { useMutation } from "react-query";
import { useContext } from "react";
import { NotificationContext } from "contexts/notification_context";
import { ArchivesService } from "coram-common-utils";

export function useSetArchiveTags() {
  const { setNotificationData } = useContext(NotificationContext);

  return useMutation(
    async ({ archiveId, tagIds }: { archiveId: number; tagIds: number[] }) =>
      ArchivesService.setArchiveTags(archiveId, { tag_ids: tagIds }),
    {
      onError: (e) => {
        setNotificationData({
          message: `Failed to update Archive Tags`,
          severity: "error",
        });
        console.error(e);
      },
    }
  );
}
