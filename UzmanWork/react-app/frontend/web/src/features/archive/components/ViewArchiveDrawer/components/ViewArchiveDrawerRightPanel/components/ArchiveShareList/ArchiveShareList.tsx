import { Stack, Typography } from "@mui/material";
import { ArchiveSharingRecord } from "./ArchiveSharingRecord";
import { ShareArchiveButton } from "features/archive/components/index";
import { useIsLimitedUser } from "components/layout/RoleGuards";

interface ArchiveShareListProps {
  archiveId: number;
  sharingEmails: string[];
  refetchArchives: () => Promise<unknown>;
}

export function ArchiveShareList({
  archiveId,
  sharingEmails,
  refetchArchives,
}: ArchiveShareListProps) {
  const isSharedWithAnyone = sharingEmails.length > 0;
  const allowShare = useIsLimitedUser();

  return (
    <Stack gap={1.5}>
      <Typography variant="h3">Shared with:</Typography>
      <Stack gap={1} alignItems="left">
        {isSharedWithAnyone ? (
          sharingEmails.map((email) => (
            <ArchiveSharingRecord
              key={email}
              archiveId={archiveId}
              email={email}
              refetchArchives={refetchArchives}
            />
          ))
        ) : (
          <Typography variant="body2" color="#83889E">
            This archive is not shared with anyone
          </Typography>
        )}
        {allowShare && (
          <ShareArchiveButton
            archiveId={archiveId}
            refetchArchives={refetchArchives}
          />
        )}
      </Stack>
    </Stack>
  );
}
