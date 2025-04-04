import { Avatar, Stack, Typography } from "@mui/material";
import { ArchiveClipData } from "utils/archives_types";
import { isDefined } from "utils/types";
import { PlayCircleOutline as PlayCircleOutlineIcon } from "@mui/icons-material";
import { ArchiveCommentResponse } from "../types";

interface ArchiveCommentItemProps {
  comment: ArchiveCommentResponse;
  onClipClick: (clip: ArchiveClipData) => void;
}

export function ArchiveCommentItem({
  comment,
  onClipClick,
}: ArchiveCommentItemProps) {
  const clipData = comment.attached_clip_data;

  return (
    <Stack gap={0.5}>
      <Stack direction="row" justifyContent="left" alignItems="center" gap={1}>
        <Avatar
          sx={{
            bgcolor: "neutral.200",
            color: "common.black",
            fontSize: "12px",
            width: "24px",
            height: "24px",
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            {`${comment.comment.user_email[0]}`.toUpperCase()}
          </Typography>
        </Avatar>
        <Typography variant="body2">{comment.comment.user_email}</Typography>
        <Typography variant="body3" color="gray">
          {`${comment.comment.creation_time
            .setZone("PST")
            .toFormat("dd LLL yyyy hh:mm a")} PST`}
        </Typography>
      </Stack>
      <Stack pl="40px" maxWidth="450px" gap={0.5}>
        <Typography variant="body2">{comment.comment.comment}</Typography>
        {isDefined(clipData) && (
          <Stack
            direction="row"
            justifyContent="left"
            alignItems="center"
            gap={1}
          >
            <PlayCircleOutlineIcon
              color="primary"
              sx={{ cursor: "pointer" }}
              onClick={() => onClipClick(clipData)}
            />
            <Typography variant="body2">Added a clip.</Typography>
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
