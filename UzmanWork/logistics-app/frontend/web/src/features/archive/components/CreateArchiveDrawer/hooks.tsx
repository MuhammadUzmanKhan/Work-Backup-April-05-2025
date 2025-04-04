import { useMutation } from "react-query";
import { useContext } from "react";
import { NotificationContext } from "contexts/notification_context";
import { ArchivesService } from "coram-common-utils";
import { formatDateTime } from "utils/dates";
import { TimeInterval } from "utils/time";

export function useCreateArchive(onSuccess?: () => void) {
  const { setNotificationData } = useContext(NotificationContext);

  return useMutation(
    async ({
      title,
      description,
      macAddress,
      clipTimeInterval,
      tagsIds,
    }: {
      title: string;
      description: string;
      macAddress: string;
      clipTimeInterval: TimeInterval;
      tagsIds: number[];
    }) =>
      ArchivesService.createArchive({
        title: title,
        archive_description: description,
        clip_request: {
          mac_address: macAddress,
          start_time: formatDateTime(clipTimeInterval.timeStart),
          end_time: formatDateTime(clipTimeInterval.timeEnd),
        },
        tags: tagsIds,
      }),
    {
      onSuccess: () => {
        setNotificationData({
          message: "Archive has been successfully created!",
          severity: "success",
        });
        onSuccess?.();
      },
      onError: (e) => {
        setNotificationData({
          message: "Failed to create archive",
          severity: "error",
        });
        console.error(e);
      },
    }
  );
}

export function useAddClipToExistingArchive(onSuccess?: () => void) {
  const { setNotificationData } = useContext(NotificationContext);

  return useMutation(
    async ({
      archiveId,
      comment,
      macAddress,
      clipTimeInterval,
    }: {
      archiveId: number;
      comment: string;
      macAddress: string;
      clipTimeInterval: TimeInterval;
    }) =>
      ArchivesService.addClipToExistingArchive(archiveId, {
        archive_clip: {
          mac_address: macAddress,
          start_time: formatDateTime(clipTimeInterval.timeStart),
          end_time: formatDateTime(clipTimeInterval.timeEnd),
        },
        comment: comment,
      }),
    {
      onSuccess: () => {
        setNotificationData({
          message: "Clip was added to the Archive.",
          severity: "success",
        });
        onSuccess?.();
      },
      onError: (e) => {
        setNotificationData({
          message: "Failed to add clip to the Archive",
          severity: "error",
        });
        console.error(e);
      },
    }
  );
}
