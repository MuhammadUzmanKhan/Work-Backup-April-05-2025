import {
  Avatar,
  Box,
  List,
  ListItem,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { MemberModel, UserRole, ExposedOrgFlags } from "coram-common-utils";
import { LoadingBox } from "components/video/LoadingBox";
import { useOrgFlag } from "hooks/org_features";
import { RoleSelector } from "../RoleSelector";
import { LOCATION_SELECTOR_STYLE } from "../MemberListCell";
import { MemberListItemMobile } from "./MemberListItemMobile";
import { QueryObserverResult } from "react-query";

interface MemberListProps {
  members: MemberModel[];
  refetchMembers: () => Promise<QueryObserverResult<MemberModel[]>>;
  handleMemberRoleEdit: (member: MemberModel, role: UserRole) => Promise<void>;
  handleMemberRemove: (userId: string, userEmail: string) => Promise<void>;
  isLoadingMembers: boolean;
}

export function MemberListMobile({
  members,
  refetchMembers,
  handleMemberRemove,
  handleMemberRoleEdit,
  isLoadingMembers,
}: MemberListProps) {
  const { data: isSupportTeamDisabled } = useOrgFlag(
    ExposedOrgFlags.SUPPORT_TEAM_DISABLED
  );

  return (
    <Stack>
      <Typography variant="body1">Members with access</Typography>
      <List
        sx={{
          width: "100%",
        }}
      >
        {isLoadingMembers ? (
          <LoadingBox />
        ) : (
          // Admins jumping to the top.
          members
            .sort((member1, member2) =>
              member1.name.localeCompare(member2.name)
            )
            .map((user: MemberModel) => (
              <MemberListItemMobile
                user={user}
                refetchMembers={refetchMembers}
                removeMember={async () =>
                  await handleMemberRemove(user.user_id, user.email)
                }
                handleUpdateAccess={handleMemberRoleEdit}
                key={user.user_id}
              />
            ))
        )}
        {!isSupportTeamDisabled && (
          <ListItem
            sx={{
              columnGap: 2,
              rowGap: 1,
              flexWrap: "wrap",
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
              C
            </Avatar>
            <ListItemText
              primary={"Coram AI Support"}
              secondary={"support@coram.ai"}
              primaryTypographyProps={{
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
              <Stack
                direction="row"
                alignItems="center"
                border={1}
                borderColor="#DFE0E6"
                sx={{
                  cursor: "auto",
                  gridTemplateColumns: "1fr 1fr",
                  ...LOCATION_SELECTOR_STYLE,
                }}
              >
                <Tooltip
                  title="Admin has access to all the cameras"
                  placement="left-start"
                >
                  <Typography variant="body1" sx={{ color: "neutral.400" }}>
                    {"All Cameras"}
                  </Typography>
                </Tooltip>
              </Stack>
              <RoleSelector
                initialRole={UserRole.ADMIN}
                onRoleChange={() => undefined}
                selectorProps={{
                  fontSize: "14px",
                  color: "neutral.400",
                }}
                disabled={true}
              />
            </Box>
          </ListItem>
        )}
      </List>
    </Stack>
  );
}
