import {
  ArchiveClipData as ArchiveClipDataOrig,
  ArchiveComment as ArchiveCommentOrig,
  ArchiveResponse as ArchiveResponseOrig,
  ClipData as ClipDataOrig,
  ThumbnailResponse,
} from "coram-common-utils";
import { DateTime } from "luxon";
import {
  convertThumbnailResponse,
  ThumbnailResponseWithJSDate,
} from "./thumbnails_types";
import { isDefined } from "./types";

export interface ClipData
  extends Omit<ClipDataOrig, "start_time" | "end_time" | "creation_time"> {
  start_time: DateTime;
  end_time: DateTime;
  creation_time: DateTime;
}

export function parseClipData(clipData: ClipDataOrig): ClipData {
  return {
    ...clipData,
    start_time: DateTime.fromISO(clipData.start_time),
    end_time: DateTime.fromISO(clipData.end_time),
    creation_time: DateTime.fromISO(clipData.creation_time),
  };
}

export interface ArchiveClipData
  extends Omit<ArchiveClipDataOrig, "clip" | "creation_time"> {
  creation_time: DateTime;
  clip: ClipData;
}

export function parseArchiveClipData(
  archiveClipData: ArchiveClipDataOrig
): ArchiveClipData {
  return {
    ...archiveClipData,
    creation_time: DateTime.fromISO(archiveClipData.creation_time),
    clip: parseClipData(archiveClipData.clip),
  };
}

export interface ArchiveComment
  extends Omit<ArchiveCommentOrig, "creation_time"> {
  creation_time: DateTime;
}

export function parseArchiveComment(
  archiveComment: ArchiveCommentOrig
): ArchiveComment {
  return {
    ...archiveComment,
    creation_time: DateTime.fromISO(archiveComment.creation_time),
  };
}

export interface ArchiveResponse
  extends Omit<
    ArchiveResponseOrig,
    "clips" | "creation_time" | "comments" | "clips_preview_thumbnails"
  > {
  clips: ArchiveClipData[];
  creation_time: DateTime;
  comments: ArchiveComment[];
  preview_thumbnail?: ThumbnailResponseWithJSDate;
  clips_preview_thumbnails: Map<number, ThumbnailResponseWithJSDate>;
}

export function parseArchiveResponse(
  archiveResponse: ArchiveResponseOrig
): ArchiveResponse {
  const clipIds = Object.keys(
    archiveResponse.clips_preview_thumbnails ?? {}
  ).map(parseInt);

  const previewThumbnail: ThumbnailResponse | undefined = Object.values(
    archiveResponse.clips_preview_thumbnails ?? {}
  )[0];

  return {
    ...archiveResponse,
    clips: archiveResponse.clips.map(parseArchiveClipData),
    creation_time: DateTime.fromISO(archiveResponse.creation_time),
    comments: archiveResponse.comments.map(parseArchiveComment),
    preview_thumbnail: isDefined(previewThumbnail)
      ? convertThumbnailResponse(previewThumbnail)
      : undefined,
    clips_preview_thumbnails: clipIds.reduce((acc, clipId) => {
      const thumbnail = archiveResponse.clips_preview_thumbnails?.[clipId];
      if (isDefined(thumbnail)) {
        acc.set(clipId, convertThumbnailResponse(thumbnail));
      }
      return acc;
    }, new Map<number, ThumbnailResponseWithJSDate>()),
  };
}
