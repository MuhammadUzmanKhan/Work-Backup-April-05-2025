import { Stack, Typography } from "@mui/material";
import { DateTime } from "luxon";
import { ArchiveTags } from "../ArchiveTags";
import { TagResponse } from "coram-common-utils";

interface ArchiveInfoProps {
  archiveId: number;
  creatorEmail: string;
  creationDate: DateTime;
  description: string;
  tags: TagResponse[];
}

export function ArchiveInfo({
  archiveId,
  creatorEmail,
  creationDate,
  description,
  tags,
}: ArchiveInfoProps) {
  return (
    <>
      <Stack gap={0.5}>
        <Typography
          variant="body2"
          color="text.secondary"
          display="flex"
          alignItems="center"
          gap={0.5}
        >
          Created by:
          <Typography variant="body2" component="span" color="text.primary">
            {creatorEmail}
          </Typography>
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          display="flex"
          alignItems="center"
          gap={0.5}
        >
          Created on:
          <Typography variant="body2" component="span" color="text.primary">
            {creationDate.toLocaleString(DateTime.DATE_FULL)}
          </Typography>
        </Typography>
      </Stack>
      <Typography
        variant="body1"
        title={description}
        sx={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {description}
      </Typography>
      <ArchiveTags
        archiveId={archiveId}
        archiveTags={tags}
        editable={false}
        maxLines={1}
      />
    </>
  );
}
