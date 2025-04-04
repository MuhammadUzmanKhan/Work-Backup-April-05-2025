import { Menu, MenuItem, Typography } from "@mui/material";
import { NotificationContext } from "contexts/notification_context";
import { useContext, useState } from "react";
import { ShareOutlined as ShareOutlinedIcon } from "@mui/icons-material";
import { ArchivesService, MountIf } from "coram-common-utils";
import { ShareArchiveDialog } from "features/archive";
import { useConfirmDelete } from "utils/confirm";
import { DeleteMenuItem } from "utils/menu_items";

interface ArchiveActionsProps {
  archiveId: number;
  allowShare: boolean;
  allowDeletion: boolean;
  anchorEl: HTMLButtonElement | null;
  onMenuClose: VoidFunction;
  onDelete: VoidFunction;
  refetchArchives: () => Promise<unknown>;
}

export function ArchiveActions({
  archiveId,
  allowShare,
  allowDeletion,
  anchorEl,
  onMenuClose,
  onDelete,
  refetchArchives,
}: ArchiveActionsProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const { setNotificationData } = useContext(NotificationContext);

  async function handleDeleteArchive() {
    try {
      await ArchivesService.deleteArchive(archiveId);
      await refetchArchives();
      onDelete();
      setNotificationData({
        severity: "success",
        message: "Archive deleted successfully.",
      });
    } catch (error) {
      setNotificationData({
        severity: "error",
        message: "Failed to delete archive.",
      });
    }
  }

  const handleDeleteWithConfirmation = useConfirmDelete(handleDeleteArchive);

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={onMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: -4,
          horizontal: "left",
        }}
      >
        <MountIf condition={allowShare}>
          <MenuItem
            sx={{ display: "flex", gap: 1 }}
            onClick={() => {
              onMenuClose();
              setShareOpen(true);
            }}
          >
            <ShareOutlinedIcon
              sx={{ color: "text.primary", fontSize: "medium" }}
            />
            <Typography variant="body2">Share</Typography>
          </MenuItem>
        </MountIf>
        <MountIf condition={allowDeletion}>
          <DeleteMenuItem
            label="Delete"
            onClick={async () => {
              onMenuClose();
              await handleDeleteWithConfirmation();
            }}
          />
        </MountIf>
      </Menu>
      <ShareArchiveDialog
        archiveId={archiveId}
        open={shareOpen}
        setShareOpen={setShareOpen}
        refetchArchives={refetchArchives}
      />
    </>
  );
}
