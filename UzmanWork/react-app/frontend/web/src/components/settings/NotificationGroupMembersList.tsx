import { useContext, useEffect, useState } from "react";
import {
  NotificationGroupMemberCell,
  ExtendedNotificationGroupMember,
} from "./NotificationGroupMemberCell";
import {
  NotificationGroupMember,
  NotificationGroupsService,
} from "coram-common-utils";
import { NotificationContext } from "contexts/notification_context";

interface NotificationGroupMembersListProps {
  groupId: number;
  groupMembers: Array<NotificationGroupMember>;
  refetch: () => void;
}
export function NotificationGroupMembersList({
  groupId,
  groupMembers,
  refetch,
}: NotificationGroupMembersListProps) {
  // Initialize unsaved group members
  const [unsavedGroupMembers, setUnsavedGroupMembers] = useState<
    Array<ExtendedNotificationGroupMember>
  >([]);
  // Remove unsaved group members which has same member id as group members in
  // the database
  useEffect(() => {
    setUnsavedGroupMembers((prevUnsavedGroupMembers) => {
      const unsavedGroupMembers = [...prevUnsavedGroupMembers];
      return unsavedGroupMembers.filter(
        (member) => !groupMembers.some((m) => m.id === member.id)
      );
    });
  }, [groupMembers]);

  const { setNotificationData } = useContext(NotificationContext);

  async function onMemberCreate() {
    setUnsavedGroupMembers((prevMembers) => [
      ...prevMembers,
      {
        id: prevMembers[prevMembers.length - 1]?.id + 1 || 0,
        group_id: groupId,
        isSaved: false,
      },
    ]);
  }

  async function onMemberSave(member: ExtendedNotificationGroupMember) {
    try {
      if (member.isSaved) {
        // Update the group member in the database
        await NotificationGroupsService.updateNotificationGroupMember(
          member.id,
          {
            notification_group_member: {
              user_name: member.user_name,
              email_address: member.email_address,
              phone_number: member.phone_number,
            },
          }
        );
      } else {
        // Create the group member in the database
        const newMemberId =
          await NotificationGroupsService.addNotificationGroupMember({
            notification_group_member: {
              group_id: groupId,
              user_name: member.user_name,
              email_address: member.email_address,
              phone_number: member.phone_number,
            },
          });
        // Update the group member in the unsaved member list
        setUnsavedGroupMembers((prevMembers) => {
          const index = prevMembers.findIndex((m) => m.id === member.id);
          // Create a new array with the updated member
          const updatedMembers = [...prevMembers];
          updatedMembers[index] = { ...member };
          updatedMembers[index].id = newMemberId;
          updatedMembers[index].isSaved = true;
          return updatedMembers;
        });
      }
      refetch();
    } catch (e) {
      setNotificationData({
        message: "Failed to save notification group member",
        severity: "error",
      });
      console.error(e);
    }
  }

  async function deleteMemberFromDatabase(memberId: number) {
    // Delete the group member from the database
    try {
      await NotificationGroupsService.deleteNotificationGroupMember(memberId);
    } catch (e) {
      setNotificationData({
        message: "Failed to delete notification group member",
        severity: "error",
      });
      console.error(e);
    }
  }

  async function onSavedMemberDelete(memberId: number) {
    // Delete the group member from the database
    await deleteMemberFromDatabase(memberId);
    refetch();
  }

  async function onUnsavedMemberDelete(memberId: number) {
    // Delete the group member from the database
    await deleteMemberFromDatabase(memberId);
    // Delete the group member from the unsaved member list
    setUnsavedGroupMembers((prevMembers) => {
      const updatedMembers = [...prevMembers];
      const index = updatedMembers.findIndex((m) => m.id === memberId);
      updatedMembers.splice(index, 1);
      return updatedMembers;
    });
  }
  return (
    <>
      {[...groupMembers]
        .sort((a, b) => a.id - b.id)
        .map((member) => (
          <NotificationGroupMemberCell
            key={member.id}
            groupMember={{ ...member, isSaved: true }}
            onMemberCreate={onMemberCreate}
            onMemberSave={onMemberSave}
            onMemberDelete={onSavedMemberDelete}
          />
        ))}
      {unsavedGroupMembers.map((member) => (
        <NotificationGroupMemberCell
          key={member.id}
          groupMember={member}
          onMemberCreate={onMemberCreate}
          onMemberSave={onMemberSave}
          onMemberDelete={onUnsavedMemberDelete}
        />
      ))}
    </>
  );
}
