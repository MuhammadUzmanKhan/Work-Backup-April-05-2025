import { Stack, Typography } from "@mui/material";

import {
  ArchiveCommentItem,
  ArchiveNewCommentEditor,
  NoCommentsPlaceholder,
} from "./components";
import { ArchiveClipData } from "utils/archives_types";
import { useAddComment, useArchiveComments } from "./hooks";

interface ArchiveCommentsProps {
  archiveId: number;
  onClipClick: (clip: ArchiveClipData) => void;
}

export function ArchiveComments({
  archiveId,
  onClipClick,
}: ArchiveCommentsProps) {
  const { data: comments } = useArchiveComments(archiveId);
  const sortedComments = [...comments].sort((c1, c2) =>
    c1.comment.creation_time > c2.comment.creation_time ? -1 : 1
  );

  const { mutateAsync: addComment, isLoading: isAddingComment } =
    useAddComment();

  return (
    <Stack gap={2}>
      <Typography variant="h3">Comments</Typography>
      <ArchiveNewCommentEditor
        isCreationPending={isAddingComment}
        onCreateComment={async (comment) => addComment({ archiveId, comment })}
      />
      {sortedComments.length > 0 ? (
        sortedComments.map((comment) => (
          <ArchiveCommentItem
            key={comment.comment.id}
            comment={comment}
            onClipClick={onClipClick}
          />
        ))
      ) : (
        <NoCommentsPlaceholder />
      )}
    </Stack>
  );
}
