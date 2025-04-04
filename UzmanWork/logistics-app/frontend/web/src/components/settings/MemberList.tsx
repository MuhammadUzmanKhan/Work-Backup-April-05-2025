import {
  Avatar,
  List,
  ListItemText,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { MemberModel, UserRole, ExposedOrgFlags } from "coram-common-utils";
import { LoadingBox } from "components/video/LoadingBox";
import { RoleSelector } from "./RoleSelector";
import { DateTime } from "luxon";
import { MemberListCell, LOCATION_SELECTOR_STYLE } from "./MemberListCell";
import { useOrgFlag } from "hooks/org_features";
import { QueryObserverResult } from "react-query";
import { SortHeadCell } from "components/SortHeadCell";
import { useSortable } from "utils/sortable";
import { sortMembersList } from "./utils";
export type MembersTableSortKeys = "last_login" | "role";

interface MemberListProps {
  members: MemberModel[];
  refetchMembers: () => Promise<QueryObserverResult<MemberModel[]>>;
  handleMemberRoleEdit: (member: MemberModel, role: UserRole) => Promise<void>;
  handleMemberRemove: (userId: string, userEmail: string) => Promise<void>;
  isLoadingMembers: boolean;
}

export function MemberList({
  members,
  refetchMembers,
  handleMemberRoleEdit,
  handleMemberRemove,
  isLoadingMembers,
}: MemberListProps) {
  const { data: isSupportTeamDisabled } = useOrgFlag(
    ExposedOrgFlags.SUPPORT_TEAM_DISABLED
  );
  const sortable = useSortable<MembersTableSortKeys>("last_login");

  return (
    <>
      <Typography variant="h3" sx={{ pt: "2rem" }}>
        Members with access
      </Typography>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <SortHeadCell<MembersTableSortKeys>
                sortKey="last_login"
                sortable={sortable}
              >
                <Typography variant="body2">Last login</Typography>
              </SortHeadCell>
              <TableCell>Access</TableCell>
              <SortHeadCell<MembersTableSortKeys>
                sortKey="role"
                sortable={sortable}
              >
                <Typography variant="body2">Role</Typography>
              </SortHeadCell>
            </TableRow>
          </TableHead>
          {isLoadingMembers ? (
            <LoadingBox />
          ) : (
            <TableBody>
              {sortMembersList(members, sortable.orderBy, sortable.order).map(
                (user: MemberModel) => (
                  <TableRow key={user.user_id} sx={{ py: "0.7rem" }}>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
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
                        />
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Tooltip
                        arrow={true}
                        title={
                          user.last_login ? (
                            DateTime.fromISO(user.last_login).toLocaleString(
                              DateTime.DATETIME_FULL
                            )
                          ) : (
                            <Typography variant="body2">Never</Typography>
                          )
                        }
                      >
                        <Typography variant="body2">
                          {user.last_login ? (
                            `${DateTime.fromISO(
                              user.last_login
                            ).toRelativeCalendar()}`
                          ) : (
                            <Typography variant="body2">Never</Typography>
                          )}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <MemberListCell
                        user={user}
                        refetchMembers={refetchMembers}
                      />
                    </TableCell>
                    <TableCell>
                      <RoleSelector
                        initialRole={user.role}
                        removeMember={async () =>
                          await handleMemberRemove(user.user_id, user.email)
                        }
                        onRoleChange={async (value) =>
                          await handleMemberRoleEdit(user, value)
                        }
                        selectorProps={{
                          color: "neutral.600",
                        }}
                      />
                    </TableCell>
                  </TableRow>
                )
              )}
              {!isSupportTeamDisabled && (
                <TableRow key={null} sx={{ py: "0.7rem" }}>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
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
                      />
                    </Stack>
                  </TableCell>
                  <TableCell />
                  <TableCell>
                    <Stack
                      direction="row"
                      alignItems="center"
                      border={1}
                      borderColor="#DFE0E6"
                      p={2}
                      sx={{
                        cursor: "auto",
                        ...LOCATION_SELECTOR_STYLE,
                      }}
                    >
                      <Tooltip
                        title="Admin has access to all the cameras"
                        placement="left-start"
                      >
                        <Typography variant="body1">{"All Cameras"}</Typography>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <RoleSelector
                      initialRole={UserRole.ADMIN}
                      onRoleChange={() => undefined}
                      selectorProps={{
                        fontSize: "14px",
                        color: "neutral.400",
                      }}
                      disabled={true}
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          )}
        </Table>
      </TableContainer>
      <List
        sx={{
          width: "100%",
        }}
      ></List>
    </>
  );
}
