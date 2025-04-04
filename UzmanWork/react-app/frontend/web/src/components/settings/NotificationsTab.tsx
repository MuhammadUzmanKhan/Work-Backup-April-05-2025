import { useAuth0 } from "@auth0/auth0-react";
import { Divider, Link, Stack, Typography } from "@mui/material";
import { useNotificationGroups } from "utils/globals";
import { LoadingBox } from "components/video/LoadingBox";
import { NotificationGroupsList } from "./NotificationGroupsList";
import { UserNotificationSwitch } from "./UserNotificationSwitch";

export function NotificationsTab() {
  const { user } = useAuth0();
  const {
    data: notificationGroups,
    isFetchedAfterMount: isFetched,
    refetch: refetch,
  } = useNotificationGroups();

  return (
    <Stack padding={3} spacing={1}>
      <Typography variant="h2">
        Get notified if appliances or cameras are down
      </Typography>
      <UserNotificationSwitch userEmail={user?.email} />
      <Divider sx={{ width: "100%" }} />
      <Stack spacing={3} py={2}>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="h2">Notification Group</Typography>
          <Link
            target="_blank"
            sx={{ cursor: "pointer" }}
            href="https://help.coram.ai/en/articles/8807575-creating-notification-groups"
          >
            Notification Group Documentation
          </Link>
        </Stack>
        {!isFetched ? (
          <LoadingBox />
        ) : (
          <NotificationGroupsList
            notificationGroups={Array.from(notificationGroups.values())}
            refetch={refetch}
          />
        )}
      </Stack>
    </Stack>
  );
}
