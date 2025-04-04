import { useAuth0 } from "@auth0/auth0-react";
import {
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from "@mui/material";

export function UserCardMobile() {
  const { user } = useAuth0();

  return (
    <List>
      <ListItem sx={{ px: 0, gap: 2 }}>
        <ListItemAvatar>
          <Avatar
            alt="user icon"
            src="/static/user.png"
            sx={{
              width: "60px",
              height: "60px",
            }}
          />
        </ListItemAvatar>
        <ListItemText
          primary={user?.email}
          primaryTypographyProps={{
            fontWeight: "600",
            fontSize: "14px",
          }}
          secondary={user?.role || "Member"}
        />
      </ListItem>
    </List>
  );
}
