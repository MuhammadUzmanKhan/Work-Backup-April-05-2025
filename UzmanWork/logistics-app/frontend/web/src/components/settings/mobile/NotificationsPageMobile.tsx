import { useAuth0 } from "@auth0/auth0-react";
import { MailOutline as MailOutlineIcon } from "@mui/icons-material";
import {
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { SubscriberAlertType } from "coram-common-utils";
import { useNotificationsSubscriptionHandle } from "hooks/notifications_subscription";

export function NotificationsPageMobile() {
  const { user } = useAuth0();
  const {
    isTargetSubscribed,
    addSubscriptionTarget,
    removeSubscriptionTarget,
  } = useNotificationsSubscriptionHandle();

  return (
    <Stack padding={3} width="100vw">
      <Typography variant="body1" sx={{ fontSize: "17px" }}>
        Get notified if appliances or cameras are down
      </Typography>
      <List
        sx={{
          width: "100%",
          bgcolor: "background.paper",
        }}
      >
        <ListItem
          secondaryAction={
            <Switch
              checked={isTargetSubscribed(user?.email)}
              onChange={async (event) => {
                if (event.target.checked) {
                  await addSubscriptionTarget(
                    SubscriberAlertType.EMAIL,
                    user?.email
                  );
                } else {
                  await removeSubscriptionTarget(
                    SubscriberAlertType.EMAIL,
                    user?.email
                  );
                }
              }}
            />
          }
        >
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: "neutral.200", borderRadius: "2rem" }}>
              <MailOutlineIcon color="action" />
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary="E-mail Address" secondary={user?.email} />
        </ListItem>
        <Divider variant="fullWidth" component="li" />
      </List>
    </Stack>
  );
}
