import { useAuth0 } from "@auth0/auth0-react";
import { ArchivesService } from "coram-common-utils";
import ShareDialog from "components/ShareDialog";
import { matchApiException } from "utils/error_handling";

interface ArchiveShareDialogProps {
  archiveId: number;
  open: boolean;
  setShareOpen: (open: boolean) => void;
  refetchArchives: () => Promise<unknown>;
}

export function ShareArchiveDialog({
  archiveId,
  open,
  setShareOpen,
  refetchArchives,
}: ArchiveShareDialogProps) {
  const { user } = useAuth0();

  return (
    <ShareDialog
      shareOpen={open}
      setShareOpen={setShareOpen}
      refetch={refetchArchives}
      onShare={async (emails) => {
        await ArchivesService.shareArchive({
          archive_id: archiveId,
          emails: emails,
          sender_email: user?.email ? user.email : "",
        });
      }}
      title="Share Archive"
      text="Only Archive Owners can delete the archive. Archive Owners and Admin users can share the Archive and update its title and description. All users with access to the archive can view, comment, and add new clips."
      successMessage={(emails: string[]) => {
        return "Successfully shared archive with " + emails.join(", ");
      }}
      errorMessage={errorMessage}
    />
  );
}

function errorMessage(e: unknown) {
  return matchApiException(e, "Archive is already shared with user")
    ? "Archive is already shared with at least one of these users!"
    : "Failure sharing archive!";
}
