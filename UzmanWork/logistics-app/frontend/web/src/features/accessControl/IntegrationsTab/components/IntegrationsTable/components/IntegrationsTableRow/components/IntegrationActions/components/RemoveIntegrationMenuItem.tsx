import { CircularProgress, MenuItem, Stack, Typography } from "@mui/material";
import { HighlightOff as HighlightOffIcon } from "@mui/icons-material";
import type { QueryObserverResult } from "react-query";
import { AccessControlIntegration } from "coram-common-utils";
import { useContext, useState } from "react";
import { NotificationContext } from "contexts/notification_context";
import { useConfirmDelete } from "utils/confirm";

export interface RemoveIntegrationMenuItemProps {
  onDelete: VoidFunction;
  onMenuClose: VoidFunction;
  refetchIntegrations: () => Promise<
    QueryObserverResult<AccessControlIntegration[]>
  >;
}

export function RemoveIntegrationMenuItem({
  onDelete,
  onMenuClose,
  refetchIntegrations,
}: RemoveIntegrationMenuItemProps) {
  const { setNotificationData } = useContext(NotificationContext);

  const [removeIntegrationPending, setRemoveIntegrationPending] =
    useState(false);

  const removeIntegrationWithConfirmation = useConfirmDelete(onDelete);

  async function handleDeleteIntegration() {
    try {
      setRemoveIntegrationPending(true);

      const hasBeenRemoved = await removeIntegrationWithConfirmation(
        "If you remove this Integration, you will loose access to all its access points and events."
      );

      if (hasBeenRemoved) {
        setNotificationData({
          message: "The Integration was removed successfully!",
          severity: "success",
        });
      }
    } catch (e) {
      setNotificationData({
        message: "Failed to remove the Integration. Please try again.",
        severity: "error",
      });
      console.error(e);
    } finally {
      setRemoveIntegrationPending(false);
      onMenuClose();
      await refetchIntegrations();
    }
  }

  return (
    <MenuItem onClick={handleDeleteIntegration}>
      <Stack direction="row" alignContent="center" alignItems="center" gap={1}>
        {removeIntegrationPending ? (
          <CircularProgress size={18} color="secondary" />
        ) : (
          <HighlightOffIcon fontSize="small" />
        )}
        <Typography variant="body2">Remove</Typography>
      </Stack>
    </MenuItem>
  );
}
