import {
  Add as AddIcon,
  CancelOutlined as CancelOutlinedIcon,
} from "@mui/icons-material";
import {
  Divider,
  FormControl,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import {
  ApiError,
  CameraGroup,
  CameraResponse,
  DevicesService,
} from "coram-common-utils";
import { useIsAdmin } from "components/layout/RoleGuards";
import React, { useContext } from "react";
import { useCameraGroups } from "utils/globals";
import { NewGroupName } from "../NewGroupName";
import { NotificationContext } from "contexts/notification_context";

export interface GroupOption {
  label: string;
  id: number;
  isDefault: boolean;
}

function useGroupOptions() {
  const { data: groups, refetch: refetchGroups } = useCameraGroups();

  const groupOptions = React.useMemo(() => {
    return new Map<string, GroupOption>(
      Array.from(groups as Map<number, CameraGroup>).map(([, group]) => [
        group.name,
        { id: group.id, label: group.name, isDefault: group.is_default },
      ])
    );
  }, [groups]);

  return {
    data: groupOptions,
    refetch: refetchGroups,
  };
}

const selectorStyles = {
  position: "relative",
  fontWeight: "200",
  minWidth: 180,
  borderRadius: "0.2rem",
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "neutral.1000",
  },
  "& .MuiOutlinedInput-input": {
    color: "neutral.1000",
  },
  "& .MuiSelect-outlined": {
    p: 1,
    px: 2,
  },
};

interface UpdateCameraGroupProps {
  camera: CameraResponse;
  refetch: () => void;
}
// Component that allows the user to change the camera group for a given
// stream. The user can either select one of the present groups in the
// organization or create a new one using an additional dialog.
export function UpdateCameraGroup({ camera, refetch }: UpdateCameraGroupProps) {
  const { setNotificationData } = useContext(NotificationContext);

  // The list of groups that already exists for the current organization
  const { data: groups, refetch: refetchGroups } = useGroupOptions();
  // The selected group. If the input text does not match an existing group the
  // value of the state variable is undefined.
  const [selectedGroup, setSelectedGroup] = React.useState<GroupOption>({
    id: camera.camera.camera_group_id,
    label: camera.group_name,
    isDefault: camera.is_default_group,
  });
  const [loading, setLoading] = React.useState(false);
  // The raw value in the autocomplete field. If there is no existing group
  // selected this value is used to create a new group.
  const [newGroup, setNewGroup] = React.useState("");
  const [editMode, setEditMode] = React.useState<boolean>(false);

  React.useEffect(() => {
    setSelectedGroup({
      id: camera.camera.camera_group_id as number,
      label: camera.group_name,
      isDefault: camera.is_default_group,
    });
  }, [
    camera.group_name,
    camera.camera.camera_group_id,
    camera.is_default_group,
  ]);

  function showError(error: unknown) {
    let message = "Something went wrong! Try Again.";
    if (error instanceof ApiError) {
      message = error.body.detail;
    }
    setNotificationData({
      message: message,
      severity: "error",
    });
  }

  const handleGroupChange = async (groupId: number) => {
    setLoading(true);
    try {
      await DevicesService.updateCameraGroup(camera.camera.id, groupId);
      refetch();
      setLoading(false);
    } catch (error) {
      showError(error);
    }
  };

  const handleGroupDelete = async () => {
    setLoading(true);
    try {
      await DevicesService.deleteCameraGroup(camera.camera.id);
      refetch();
      setLoading(false);
    } catch (error) {
      showError(error);
    }
  };

  const createNewGroup = async () => {
    if (groups.has(newGroup)) {
      return;
    }

    try {
      const newGroupId = await DevicesService.createGroup({
        name: newGroup,
      });
      await handleGroupChange(newGroupId);
      setSelectedGroup({ id: newGroupId, label: newGroup, isDefault: false });

      refetch();
      refetchGroups();
      setEditMode(false);

      setNotificationData({
        message: "A new group name has been created!",
        severity: "success",
      });
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };
  const isAdmin = useIsAdmin();

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <FormControl>
        <Select
          disabled={!isAdmin}
          value={selectedGroup.isDefault ? "" : selectedGroup.id}
          displayEmpty
          sx={{
            ...selectorStyles,
          }}
          renderValue={() => {
            if (selectedGroup.isDefault) {
              return <span>Default Group</span>;
            }
            return selectedGroup.label;
          }}
          onClose={() => {
            setEditMode(false);
            setNewGroup("");
          }}
        >
          <MenuItem disabled sx={{ display: "none" }} value="">
            Placeholder
          </MenuItem>
          {!editMode ? (
            <Stack flexDirection="row">
              <Typography
                variant="body2"
                color="primary.main"
                onClick={(ev) => {
                  ev.stopPropagation();
                  setEditMode(true);
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  marginLeft: "0.5rem",
                  paddingBottom: "0.3rem",
                }}
              >
                <AddIcon sx={{ fontSize: "0.75rem" }} color="primary" />
                Add New
              </Typography>
            </Stack>
          ) : (
            <NewGroupName
              loading={loading}
              onCancel={() => {
                setEditMode(false);
                setNewGroup("");
              }}
              newGroup={newGroup}
              setNewGroup={setNewGroup}
              onSuccess={createNewGroup}
            />
          )}
          {Array.from(groups.values())
            .filter((group) => !group.isDefault)
            .map((group) => (
              <MenuItem
                key={group.id}
                value={group.id}
                onClick={async () => {
                  setSelectedGroup(group);
                  await handleGroupChange(group.id);
                }}
              >
                <Typography variant="body2">{group.label}</Typography>
              </MenuItem>
            ))}
          {!selectedGroup.isDefault && (
            <Stack flexDirection="column" mt={1} gap={1}>
              <Divider
                sx={{ width: "100%", height: 1, borderStyle: "dashed" }}
              />
              <Typography
                variant="body2"
                onClick={(ev) => {
                  ev.stopPropagation();
                  handleGroupDelete();
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  marginLeft: "0.5rem",
                  gap: "3px",
                }}
              >
                <CancelOutlinedIcon sx={{ fontSize: "0.75rem" }} />
                Clear
              </Typography>
            </Stack>
          )}
        </Select>
      </FormControl>
    </Stack>
  );
}
