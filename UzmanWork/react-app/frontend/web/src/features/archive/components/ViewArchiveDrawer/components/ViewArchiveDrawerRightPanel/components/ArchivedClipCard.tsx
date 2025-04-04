import { Card, Typography } from "@mui/material";
import { ClipThumbnailPreview } from "components/timeline/ClipThumbnailPreview";
import { useArchiveClipThumbnails } from "hooks/archive_page";
import { ReactNode, useState } from "react";
import { ArchiveClipData } from "utils/archives_types";
import { ThumbnailResponseWithJSDate } from "utils/thumbnails_types";
import Grid from "@mui/material/Unstable_Grid2";
import { ArchiveCalendarIcon, ArchiveUserIcon } from "features/archive/icons";
import { DateTime } from "luxon";

interface ArchivedClipCardProps {
  clip: ArchiveClipData;
  isSelected: boolean;
  thumbnail?: ThumbnailResponseWithJSDate;
  onClick: VoidFunction;
}

export function ArchivedClipCard({
  clip,
  isSelected,
  thumbnail,
  onClick,
}: ArchivedClipCardProps) {
  const [enableFetchingThumbnails, setEnableFetchingThumbnails] =
    useState(false);

  const { data: thumbnailsData, isFetching } = useArchiveClipThumbnails({
    archiveId: clip.archive_id,
    clipId: clip.clip_id,
    enabled: enableFetchingThumbnails,
  });

  return (
    <Card
      component={Grid}
      container
      spacing={1}
      sx={(theme) => ({
        border: "1px solid",
        borderColor: isSelected ? "primary.light" : "transparent",
        bgcolor: isSelected
          ? "transparent"
          : theme.palette.inputsBackgroundHover.main,
        cursor: "pointer",
        p: 1,
      })}
      elevation={0}
      onClick={onClick}
    >
      <Grid
        xs={6}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
      >
        <ClipThumbnailPreview
          startTime={clip.clip.start_time}
          endTime={clip.clip.end_time}
          previewThumbnail={thumbnail}
          thumbnails={thumbnailsData}
          isFetchingThumbnail={isFetching}
          onPlayClick={() => null}
          onHoverChange={setEnableFetchingThumbnails}
          thumbnailStyle={{
            aspectRatio: "16/9",
            width: "100%",
            height: "100%",
          }}
        />
      </Grid>
      <Grid
        xs={6}
        display="flex"
        flexDirection="column"
        gap={1}
        justifyContent="center"
      >
        <ArchiveClipInfo
          icon={<ArchiveUserIcon sx={{ fontSize: "0.8rem" }} />}
          text={clip.clip_creator_email}
        />
        <ArchiveClipInfo
          icon={<ArchiveCalendarIcon sx={{ fontSize: "0.8rem" }} />}
          text={clip.clip.creation_time.toLocaleString(DateTime.DATE_FULL)}
        />
      </Grid>
    </Card>
  );
}

interface ArchiveClipInfoProps {
  icon: ReactNode;
  text: string;
}

function ArchiveClipInfo({ icon, text }: ArchiveClipInfoProps) {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
      display="flex"
      alignItems="center"
      gap={0.5}
    >
      {icon}
      <Typography variant="body2" component="span" color="text.primary">
        {text}
      </Typography>
    </Typography>
  );
}
