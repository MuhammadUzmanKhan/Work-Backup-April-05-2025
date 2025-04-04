import {
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { UserAlertSetting, UserAlertsService } from "coram-common-utils";

import { useState } from "react";

import {
  CheckOutlined as CheckOutlinedIcon,
  CloseOutlined as CloseOutlinedIcon,
  Edit as EditIcon,
} from "@mui/icons-material";

export function NameCell({
  alertSetting,
  refetch,
}: {
  alertSetting: UserAlertSetting;
  refetch: () => void;
}) {
  const [loading, setLoading] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [alertSettingName, setAlertSettingName] = useState<string | undefined>(
    alertSetting.name
  );

  const handleNameChange = async () => {
    setLoading(true);
    try {
      await UserAlertsService.updateUserAlertSettingName(
        alertSetting.id,
        alertSettingName ?? ""
      );
      refetch();
      setEditMode(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onCancelEdit = () => {
    setAlertSettingName("");
    setEditMode(false);
  };

  const onEditMode = () => {
    setAlertSettingName(alertSettingName);
    setEditMode(true);
  };

  return (
    <Stack
      flexDirection="row"
      alignItems="center"
      sx={{
        borderBottom: editMode ? "2px solid" : "none",
        borderColor: "primary.main",
        "&:hover .edit": { visibility: "visible !important" },
      }}
    >
      {!editMode ? (
        <>
          <Typography variant="body1">
            {alertSetting.name ?? "Unnamed"}
          </Typography>
          <IconButton
            className="edit"
            onClick={onEditMode}
            sx={{ p: 0, visibility: "hidden", ml: 1 }}
          >
            <EditIcon fontSize="small" color="primary" />
          </IconButton>
        </>
      ) : (
        <>
          <TextField
            autoFocus
            margin="dense"
            required
            value={alertSettingName}
            inputProps={{ maxLength: 64 }}
            onChange={(event) => {
              setAlertSettingName(event.target.value);
            }}
            variant="standard"
            type="text"
            sx={{
              input: { color: "neutral.400" },
              borderBottom: "none",
              maxWidth: "120px",
            }}
            InputProps={{
              disableUnderline: true,
            }}
          />
          <CloseOutlinedIcon
            fontSize="small"
            color="disabled"
            sx={{ cursor: "pointer" }}
            onClick={onCancelEdit}
          />
          {!loading ? (
            <CheckOutlinedIcon
              fontSize="small"
              color="secondary"
              sx={{ cursor: "pointer" }}
              onClick={handleNameChange}
            />
          ) : (
            <CircularProgress size={18} />
          )}
        </>
      )}
    </Stack>
  );
}
