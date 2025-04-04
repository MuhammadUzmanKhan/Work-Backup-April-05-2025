import { Stack, Typography } from "@mui/material";
import { ArchiveClipData, ArchiveResponse } from "utils/archives_types";
import { ArchivedClipCard, ArchiveShareList } from "./components";
import { ArchiveTags } from "features/archive/components";
import { DateTime } from "luxon";
import { ArchiveCalendarIcon, ArchiveUserIcon } from "features/archive/icons";
import { CollapsiblePanel } from "components/common";

interface ViewArchiveDrawerRightPanelProps {
  archive: ArchiveResponse;
  selectedClip: ArchiveClipData;
  onSelectClip: (clip: ArchiveClipData) => void;
  refetchArchives: () => Promise<unknown>;
}

export function ViewArchiveDrawerRightPanel({
  archive,
  selectedClip,
  onSelectClip,
  refetchArchives,
}: ViewArchiveDrawerRightPanelProps) {
  return (
    <Stack gap={2} height="100%" sx={{ overflowY: "auto" }}>
      <CollapsiblePanel title="Details">
        <Stack gap={1}>
          <Typography
            variant="body1"
            color="text.secondary"
            display="flex"
            alignItems="center"
            gap={0.5}
          >
            <ArchiveUserIcon sx={{ fontSize: "1rem" }} /> Created by:
            <Typography component="span" color="text.primary">
              {archive.owner_user_email}
            </Typography>
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            display="flex"
            alignItems="center"
            gap={0.5}
          >
            <ArchiveCalendarIcon sx={{ fontSize: "1rem" }} /> Created on:
            <Typography component="span" color="text.primary">
              {archive.creation_time.toLocaleString(DateTime.DATE_FULL)}
            </Typography>
          </Typography>
        </Stack>
        <ArchiveShareList
          archiveId={archive.id}
          sharingEmails={archive.share_infos.map((info) => info.user_email)}
          refetchArchives={refetchArchives}
        />
        <Stack gap={1}>
          <Typography variant="h3">Tags</Typography>
          <ArchiveTags
            archiveId={archive.id}
            archiveTags={archive.tags ?? []}
            refetchArchives={refetchArchives}
          />
        </Stack>
      </CollapsiblePanel>
      <CollapsiblePanel title="Videos">
        {archive.clips.map((clip) => (
          <ArchivedClipCard
            key={clip.clip_id}
            clip={clip}
            thumbnail={archive.clips_preview_thumbnails?.get(clip.clip_id)}
            isSelected={clip.clip_id === selectedClip.clip_id}
            onClick={() => onSelectClip(clip)}
          />
        ))}
      </CollapsiblePanel>
    </Stack>
  );
}
