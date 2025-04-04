import { useMutation, useQuery, useQueryClient } from "react-query";
import { ArchivesService } from "coram-common-utils/src/backend_client";
import { parseArchiveCommentResponse } from "./types";
import { Duration } from "luxon";
import { ARCHIVE_COMMENTS_QUERY_KEY } from "./consts";
import { useContext } from "react";
import { NotificationContext } from "contexts/notification_context";

export function useArchiveComments(archiveId: number) {
  const query = useQuery(
    [ARCHIVE_COMMENTS_QUERY_KEY, archiveId],
    async () => {
      const data = await ArchivesService.retrieveArchiveComments(archiveId);
      return data.map(parseArchiveCommentResponse);
    },
    {
      refetchOnWindowFocus: false,
      refetchInterval: Duration.fromObject({ seconds: 5 }).as("milliseconds"),
    }
  );
  return { ...query, data: query.data ?? [] };
}

export function useAddComment() {
  const { setNotificationData } = useContext(NotificationContext);

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      archiveId,
      comment,
    }: {
      archiveId: number;
      comment: string;
    }) => ArchivesService.addComment({ archive_id: archiveId, comment }),
    onSettled: async (_, __, { archiveId }) => {
      await queryClient.invalidateQueries([
        ARCHIVE_COMMENTS_QUERY_KEY,
        archiveId,
      ]);
    },
    onError: (e) => {
      setNotificationData({
        message: "Failed to add a comment",
        severity: "error",
      });
      console.error(e);
    },
  });
}
