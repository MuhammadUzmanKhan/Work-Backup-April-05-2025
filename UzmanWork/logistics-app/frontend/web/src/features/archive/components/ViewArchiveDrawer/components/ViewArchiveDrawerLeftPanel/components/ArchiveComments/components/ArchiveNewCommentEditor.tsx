import { CircularProgress, TextField } from "@mui/material";
import { Send as SendIcon } from "@mui/icons-material";
import { useState } from "react";

interface ArchiveNewCommentEditorProps {
  isCreationPending: boolean;
  onCreateComment: (comment: string) => Promise<unknown>;
}

export function ArchiveNewCommentEditor({
  isCreationPending,
  onCreateComment,
}: ArchiveNewCommentEditorProps) {
  const [newComment, setNewComment] = useState("");
  const submitDisabled = newComment == "";

  return (
    <TextField
      fullWidth
      placeholder="Write a comment"
      value={newComment}
      multiline
      maxRows={5}
      onChange={(ev) => setNewComment(ev.target.value)}
      InputProps={{
        sx: {
          fontSize: "12px",
          borderRadius: "8px",
          py: "10px",
          minHeight: "40px",
        },
        endAdornment: isCreationPending ? (
          <CircularProgress color="secondary" size={20} />
        ) : (
          !submitDisabled && (
            <SendIcon
              onClick={async () => {
                await onCreateComment(newComment);
                setNewComment("");
              }}
              fontSize="small"
              color="secondary"
              sx={{ cursor: "pointer" }}
            />
          )
        ),
      }}
    />
  );
}
