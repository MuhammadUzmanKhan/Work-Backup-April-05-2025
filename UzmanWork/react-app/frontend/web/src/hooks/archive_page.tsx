import {
  ArchivesService,
  ArchiveSummaryResponse,
} from "coram-common-utils/src/backend_client";
import { Duration } from "luxon";
import { useCallback } from "react";
import { useQuery } from "react-query";
import { parseArchiveResponse } from "utils/archives_types";
import {
  convertThumbnailResponse,
  ThumbnailResponseWithJSDate,
} from "utils/thumbnails_types";

export function useArchives() {
  const query = useQuery(
    ["retrieve_user_archives"],
    async () => {
      const archives = await ArchivesService.retrieveUserArchives();
      return archives.map(parseArchiveResponse);
    },
    {
      refetchInterval: Duration.fromObject({ seconds: 5 }).as("milliseconds"),
      refetchOnWindowFocus: false,
    }
  );
  return { ...query, data: query.data || [] };
}

export function useArchivesSummary() {
  const query = useQuery(
    ["retrieve_user_archives_summaries"],
    async () => {
      return await ArchivesService.summary();
    },
    {
      retry: 3,
      placeholderData: useCallback(() => [] as ArchiveSummaryResponse[], []),
      refetchOnWindowFocus: false,
    }
  );
  return { ...query, data: query.data || [] };
}

const EMPTY_THUMBNAILS = new Map<string, ThumbnailResponseWithJSDate>();

export function useArchiveClipThumbnails({
  archiveId,
  clipId,
  enabled,
}: {
  archiveId: number;
  clipId: number;
  enabled: boolean;
}) {
  const query = useQuery(
    ["retrieve_archive_clip_thumbnails", clipId],
    async () => {
      const data = await ArchivesService.retrieveArchiveClipThumbnails(
        archiveId,
        clipId
      );
      const mapped = new Map<string, ThumbnailResponseWithJSDate>();
      data.forEach((d) => {
        mapped.set(d.timestamp, convertThumbnailResponse(d));
      });
      return mapped;
    },
    {
      refetchOnWindowFocus: false,
      refetchInterval: Duration.fromObject({ seconds: 10 }).as("milliseconds"),
      enabled: enabled,
    }
  );
  return { ...query, data: query.data || EMPTY_THUMBNAILS };
}
