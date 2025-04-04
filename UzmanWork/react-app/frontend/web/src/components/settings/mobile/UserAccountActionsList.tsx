import { List, ListItem, ListItemText, Divider } from "@mui/material";
import { MembersService } from "coram-common-utils";
import { NotificationContext } from "contexts/notification_context";
import { useLogout } from "hooks/logout";
import { useContext } from "react";
import { confirm } from "utils/confirm";

export function UserAccountActionsList() {
  const { logoutHandler } = useLogout();
  const { setNotificationData } = useContext(NotificationContext);

  return (
    <List>
      <ListItem
        onClick={async () =>
          await logoutHandler((message: string) => {
            setNotificationData({ message, severity: "error" });
          })
        }
      >
        <ListItemText
          primary="Logout"
          primaryTypographyProps={{
            fontWeight: "600",
            fontSize: "14px",
            flexGrow: 1,
          }}
        />
      </ListItem>
      <Divider variant="fullWidth" />
      <ListItem
        onClick={async () => {
          const isConfirmed = await confirm({
            confirmText: "This action will permanently delete your account.",
            yesText: "Yes, delete my account",
            noText: "No, keep my account",
          });
          if (!isConfirmed) {
            return;
          }
          await MembersService.permanentlyDeleteOwnUser();
          logoutHandler((message: string) => {
            setNotificationData({ message, severity: "error" });
          });
        }}
      >
        <ListItemText
          primary="Delete Account"
          primaryTypographyProps={{
            color: "#83889E",
            fontWeight: "600",
            fontSize: "14px",
            flexGrow: 1,
          }}
        />
      </ListItem>
    </List>
  );
}
