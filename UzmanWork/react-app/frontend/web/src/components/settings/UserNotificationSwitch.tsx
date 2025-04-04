import { MailOutline as MailOutlineIcon } from "@mui/icons-material";
import {
  Avatar,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Switch,
} from "@mui/material";
import { SubscriberAlertType } from "coram-common-utils";
import { useNotificationsSubscriptionHandle } from "hooks/notifications_subscription";

interface UserNotificationSwitchProps {
  userEmail: string | undefined;
}

export function UserNotificationSwitch({
  userEmail,
}: UserNotificationSwitchProps) {
  const {
    isTargetSubscribed,
    addSubscriptionTarget,
    removeSubscriptionTarget,
  } = useNotificationsSubscriptionHandle();

  return (
    <>
      <ListItem
        sx={{ py: "1rem" }}
        secondaryAction={
          <Switch
            checked={isTargetSubscribed(userEmail)}
            onChange={async (event) => {
              if (event.target.checked) {
                await addSubscriptionTarget(
                  SubscriberAlertType.EMAIL,
                  userEmail
                );
              } else {
                await removeSubscriptionTarget(
                  SubscriberAlertType.EMAIL,
                  userEmail
                );
              }
            }}
          />
        }
      >
        <ListItemAvatar>
          <Avatar sx={{ bgcolor: "neutral.200", borderRadius: "2px" }}>
            <MailOutlineIcon color="action" />
          </Avatar>
        </ListItemAvatar>
        <ListItemText primary="E-mail Address" secondary={userEmail} />
      </ListItem>
    </>
  );
}
