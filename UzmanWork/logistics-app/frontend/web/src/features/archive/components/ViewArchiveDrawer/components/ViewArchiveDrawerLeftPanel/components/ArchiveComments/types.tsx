import { ArchiveCommentResponse as ArchiveCommentResponseOrig } from "coram-common-utils/src/backend_client";
import {
  ArchiveClipData,
  ArchiveComment,
  parseArchiveClipData,
  parseArchiveComment,
} from "utils/archives_types";

export interface ArchiveCommentResponse
  extends Omit<ArchiveCommentResponseOrig, "comment" | "attached_clip_data"> {
  comment: ArchiveComment;
  attached_clip_data?: ArchiveClipData;
}

export function parseArchiveCommentResponse(
  archiveCommentResponse: ArchiveCommentResponseOrig
): ArchiveCommentResponse {
  return {
    ...archiveCommentResponse,
    comment: parseArchiveComment(archiveCommentResponse.comment),
    attached_clip_data: archiveCommentResponse.attached_clip_data
      ? parseArchiveClipData(archiveCommentResponse.attached_clip_data)
      : undefined,
  };
}
