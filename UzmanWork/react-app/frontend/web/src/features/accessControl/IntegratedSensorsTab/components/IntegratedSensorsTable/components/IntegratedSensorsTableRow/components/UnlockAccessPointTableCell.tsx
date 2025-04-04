import {
  CircularProgress,
  IconButton,
  Stack,
  TableCell,
  Tooltip,
  Typography,
} from "@mui/material";
import { Lock as LockIcon } from "icons";
import { useContext, useState } from "react";
import { NotificationContext } from "contexts/notification_context";
import { AccessControlService, AccessPointVendor } from "coram-common-utils";
import { useIsAdmin } from "components/layout/RoleGuards";

interface UnlockAccessPointTableCellProps {
  isRemoteUnlockEnabled: boolean;
  accessPointId: string;
  vendor: AccessPointVendor;
}

export function UnlockAccessPointTableCell({
  isRemoteUnlockEnabled,
  accessPointId,
  vendor,
}: UnlockAccessPointTableCellProps) {
  const { setNotificationData } = useContext(NotificationContext);

  const isAdmin = useIsAdmin();

  const [isUnlockInProgress, setIsUnlockInProgress] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  async function handleUnlock() {
    try {
      setIsUnlockInProgress(true);
      await AccessControlService.unlockAccessPoint({
        id: accessPointId,
        vendor: vendor,
      });
      // TODO (@slava) This is a temporary solution to show the user that the AP has been unlocked.
      //  As soon as we have the real-time updates, we should remove this.
      setIsUnlocked(true);
      setTimeout(() => setIsUnlocked(false), 5000);
    } catch (error) {
      setNotificationData({
        message: "Failed to unlock the Access Point",
        severity: "error",
      });
      console.error(error);
    } finally {
      setIsUnlockInProgress(false);
    }
  }

  if (!isRemoteUnlockEnabled) {
    return (
      <TableCell>
        <Typography variant="body2">Remote Unlock is not enabled.</Typography>
      </TableCell>
    );
  }

  const isUnlockEnabled = isAdmin && !isUnlockInProgress && !isUnlocked;

  return (
    <TableCell>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="body2">
          {isUnlocked ? "Unlocked" : "Locked"}
        </Typography>
        <Tooltip
          title={
            isAdmin
              ? isUnlocked
                ? "Access Point is unlocked"
                : "Click to Unlock"
              : "Only Admins can unlock Access Points"
          }
        >
          <span>
            <IconButton onClick={handleUnlock} disabled={!isUnlockEnabled}>
              {isUnlockInProgress ? (
                <CircularProgress size={24} color="secondary" />
              ) : (
                <LockIcon color={isUnlockEnabled ? "primary" : "disabled"} />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </TableCell>
  );
}
