import { Avatar, Box, Divider, ListItem, ListItemText } from "@mui/material";
import { MemberListCell } from "../MemberListCell";
import { RoleSelector } from "../RoleSelector";
import { MemberModel, UserRole } from "coram-common-utils";
import { QueryObserverResult } from "react-query";

interface MemberListItemProps {
  user: MemberModel;
  removeMember?: () => Promise<void>;
  refetchMembers: () => Promise<QueryObserverResult<MemberModel[]>>;
  handleUpdateAccess: (user: MemberModel, value: UserRole) => Promise<void>;
}

export function MemberListItemMobile({
  user,
  removeMember,
  refetchMembers,
  handleUpdateAccess,
}: MemberListItemProps) {
  return (
    <>
      <ListItem
        sx={{
          columnGap: 2,
          rowGap: 1.5,
          flexWrap: "wrap",
          py: 2.5,
          px: 0,
        }}
      >
        <Avatar
          sx={{
            bgcolor: "neutral.200",
            color: "common.black",
            fontSize: "16px",
          }}
        >
          {`${user.email[0] || "U"}`.toUpperCase()}
        </Avatar>
        <ListItemText
          primary={user.name}
          secondary={user.name === user.email ? "" : user.email}
          primaryTypographyProps={{
            fontSize: "14px",
            fontWeight: "600",
          }}
        />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridGap: 10,
            width: "100%",
          }}
        >
          <MemberListCell user={user} refetchMembers={refetchMembers} />
          <RoleSelector
            initialRole={user.role}
            removeMember={removeMember}
            onRoleChange={async (value) =>
              await handleUpdateAccess(user, value)
            }
            selectorProps={{
              fontSize: "14px",
              color: "neutral.600",
            }}
          />
        </Box>
      </ListItem>
      <Divider variant="fullWidth" component="li" />
    </>
  );
}
