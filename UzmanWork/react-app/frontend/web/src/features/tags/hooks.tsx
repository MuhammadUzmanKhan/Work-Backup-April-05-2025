import { useMutation, useQuery, useQueryClient } from "react-query";
import { TagsService } from "coram-common-utils";
import { TAGS_QUERY_KEY } from "./consts";
import { useContext } from "react";
import { NotificationContext } from "contexts/notification_context";

export function useTags() {
  const query = useQuery([TAGS_QUERY_KEY], async () => TagsService.getTags(), {
    refetchOnWindowFocus: false,
  });

  return {
    ...query,
    data: query.data ?? [],
  };
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  const { setNotificationData } = useContext(NotificationContext);

  return useMutation(async (name: string) => TagsService.createTag({ name }), {
    onSettled: () => queryClient.invalidateQueries(TAGS_QUERY_KEY),
    onError: (e) => {
      setNotificationData({
        message: `Failed to create Tag`,
        severity: "error",
      });
      console.error(e);
    },
  });
}
