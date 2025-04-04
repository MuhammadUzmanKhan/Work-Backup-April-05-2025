import { Paper, Stack } from "@mui/material";
import { ClipThumbnailPreview } from "components/timeline/ClipThumbnailPreview";
import { useState } from "react";
import { ArchiveResponse } from "utils/archives_types";
import { ThumbnailResponseWithJSDate } from "utils/thumbnails_types";
import { ArchiveInfo } from "./ArchiveInfo";
import { useArchiveClipThumbnails } from "hooks/archive_page";

interface ArchiveCardProps {
  archive: ArchiveResponse;
  thumbnail?: ThumbnailResponseWithJSDate;
  onClick?: () => void;
}

export function ArchiveCard({ archive, thumbnail, onClick }: ArchiveCardProps) {
  const clip = archive.clips[0].clip;

  const [enableFetchingThumbnails, setEnableFetchingThumbnails] =
    useState(false);

  const { data: thumbnailsData, isFetching } = useArchiveClipThumbnails({
    archiveId: archive.id,
    clipId: clip.id,
    enabled: enableFetchingThumbnails,
  });

  return (
    <>
      <Paper
        component={Stack}
        gap={1}
        sx={{ borderRadius: 2, p: 1.5, cursor: "pointer" }}
        onClick={onClick}
        elevation={12}
      >
        <ClipThumbnailPreview
          startTime={clip.start_time}
          endTime={clip.end_time}
          previewThumbnail={thumbnail}
          thumbnails={thumbnailsData}
          isFetchingThumbnail={isFetching}
          onPlayClick={() => null}
          onHoverChange={setEnableFetchingThumbnails}
          thumbnailStyle={{
            aspectRatio: "16/9",
            justifyContent: "center",
            alignItems: "center",
          }}
        />
        <ArchiveInfo
          archiveId={archive.id}
          creatorEmail={archive.owner_user_email}
          creationDate={archive.creation_time}
          description={archive.title}
          tags={archive.tags ?? []}
        />
      </Paper>
    </>
  );
}
