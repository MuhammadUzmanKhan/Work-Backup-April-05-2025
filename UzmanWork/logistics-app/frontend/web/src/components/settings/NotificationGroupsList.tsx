import { Add as AddIcon } from "@mui/icons-material";
import { Button, Stack } from "@mui/material";
import {
  NotificationGroupsService,
  NotificationGroup,
  NotificationGroupMember,
  isDefined,
} from "coram-common-utils";
import { NotificationGroupNameCell } from "./NotificationGroupNameCell";
import { NotificationGroupMembersList } from "./NotificationGroupMembersList";
import { useContext, useState } from "react";
import { NotificationContext } from "contexts/notification_context";
import { matchApiException } from "utils/error_handling";
import { QueryObserverResult } from "react-query";

interface NotificationGroupsListProps {
  notificationGroups: Array<NotificationGroup>;
  refetch: () => Promise<
    QueryObserverResult<Map<number, NotificationGroup>, unknown>
  >;
}

function hasUnSavedValues(groupList: NotificationGroup[]) {
  return groupList.some((group) => {
    return group.members.some((member: NotificationGroupMember) => {
      return (
        !isDefined(member.user_name) &&
        !isDefined(member.email_address) &&
        !isDefined(member.phone_number)
      );
    });
  });
}

export function NotificationGroupsList({
  notificationGroups,
  refetch,
}: NotificationGroupsListProps) {
  const { setNotificationData } = useContext(NotificationContext);
  const [loading, setLoading] = useState<boolean>(false);

  async function onGroupCreate() {
    try {
      setLoading(true);
      const groudId = await NotificationGroupsService.addNotificationGroup();
      await NotificationGroupsService.addNotificationGroupMember({
        notification_group_member: {
          group_id: groudId,
        },
      });
      await refetch();
    } catch (e) {
      setNotificationData({
        message: matchApiException(e, "Group name already exists")
          ? "The group name already exists."
          : "Failed to add notification group.",
        severity: "error",
      });
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const creationDisabled = loading || hasUnSavedValues(notificationGroups);

  return (
    <>
      {notificationGroups.map((group) => (
        <Stack key={group.id} spacing={2}>
          <NotificationGroupNameCell group={group} refetch={refetch} />
          <NotificationGroupMembersList
            groupId={group.id}
            groupMembers={group.members}
            refetch={refetch}
          />
        </Stack>
      ))}
      <Button
        variant="contained"
        color="secondary"
        sx={{
          borderRadius: "0.2rem",
          maxWidth: "13rem",
        }}
        onClick={() => onGroupCreate()}
        disabled={creationDisabled}
      >
        <Stack direction="row" gap={1} alignItems={"start"}>
          <AddIcon /> Notification Group
        </Stack>
      </Button>
    </>
  );
}
