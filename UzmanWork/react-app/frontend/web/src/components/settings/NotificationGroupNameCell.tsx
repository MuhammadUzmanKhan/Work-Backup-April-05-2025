import { Stack, Typography } from "@mui/material";
import { useContext, useEffect, useRef, useState } from "react";
import { MoreVert as MoreVertIcon } from "@mui/icons-material";
import { StyledEditableTextField } from "components/styled_components/StyledEditableTextField";
import { EditMenu } from "../common/EditMenu";
import {
  NotificationGroup,
  NotificationGroupsService,
} from "coram-common-utils";
import { NotificationContext } from "contexts/notification_context";
import { matchApiException } from "utils/error_handling";

interface NotificationGroupNameCellProps {
  group: NotificationGroup;
  refetch: () => void;
}
export function NotificationGroupNameCell({
  group,
  refetch,
}: NotificationGroupNameCellProps) {
  const anchorEl = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [localGroupName, setLocalGroupName] = useState(group.name);
  const { setNotificationData } = useContext(NotificationContext);

  useEffect(() => {
    setLocalGroupName(group.name);
  }, [group.name]);

  async function onGroupRename(groupId: number, newName: string) {
    try {
      await NotificationGroupsService.renameNotificationGroup(groupId, {
        new_group_name: newName,
      });
    } catch (e) {
      setLocalGroupName(group.name);
      setNotificationData({
        message: matchApiException(e, "Group name already exists")
          ? "The group name already exists."
          : "Failed to rename notification group.",
        severity: "error",
      });
      console.error(e);
    }
    refetch();
  }

  async function onGroupDelete(groupId: number) {
    try {
      await NotificationGroupsService.deleteNotificationGroup(groupId);
    } catch (e) {
      setNotificationData({
        message: "Failed to delete notification group",
        severity: "error",
      });
      console.error(e);
    }
    refetch();
  }
  return (
    <>
      {editMode ? (
        <StyledEditableTextField
          value={localGroupName}
          onChange={(event) => {
            setLocalGroupName(event.target.value);
          }}
          onCancelEdit={() => {
            setLocalGroupName(group.name);
            setEditMode(false);
          }}
          onSaveEdit={() => {
            onGroupRename(group.id, localGroupName);
            setEditMode(false);
          }}
          sx={{
            input: { color: "neutral.400", fontSize: "14px" },
            maxWidth: "120px",
          }}
        />
      ) : (
        <Stack direction="row" gap={1} px={0.4} alignItems="center">
          <Typography variant="body1">{localGroupName}</Typography>
          <MoreVertIcon
            ref={anchorEl}
            onClick={() => {
              setMenuOpen(true);
            }}
            sx={{ fontSize: "1.2rem" }}
          />
          <EditMenu
            anchorEl={anchorEl.current}
            open={menuOpen}
            editLabel="Rename"
            deleteLabel="Delete"
            sx={{ mt: 1, ml: 9 }}
            setMenuOpen={setMenuOpen}
            onClose={() => setMenuOpen(false)}
            onEdit={() => {
              setEditMode(true);
              setMenuOpen(false);
            }}
            onDelete={() => onGroupDelete(group.id)}
          />
        </Stack>
      )}
    </>
  );
}
