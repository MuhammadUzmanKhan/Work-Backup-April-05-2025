import { TextField, CircularProgress, Stack } from "@mui/material";
import { Dispatch, SetStateAction } from "react";
import {
  CheckOutlined as CheckOutlinedIcon,
  CloseOutlined as CloseOutlinedIcon,
} from "@mui/icons-material";

interface NewGroupNameProps {
  loading: boolean;
  newGroup: string;
  setNewGroup: Dispatch<SetStateAction<string>>;
  onCancel: () => void;
  onSuccess: () => void;
}

export function NewGroupName({
  loading,
  newGroup,
  setNewGroup,
  onCancel,
  onSuccess,
}: NewGroupNameProps) {
  return (
    <Stack
      onKeyDown={(e) => e.stopPropagation()}
      flexDirection="row"
      alignItems="center"
      mx={2}
      mb={1}
      sx={{
        cursor: "pointer",
        borderBottom: "2px solid",
        borderColor: "primary.main",
      }}
    >
      <TextField
        autoFocus
        margin="dense"
        required
        value={newGroup}
        onChange={(event) => {
          setNewGroup(event.target.value);
        }}
        variant="standard"
        type="text"
        sx={{
          input: { color: "neutral.400", fontSize: "14px" },
          borderBottom: "none",
          mt: 0,
          width: "100px",
        }}
        InputProps={{
          disableUnderline: true,
        }}
      />
      <CloseOutlinedIcon
        fontSize="small"
        color="disabled"
        sx={{ cursor: "pointer" }}
        onClick={onCancel}
      />
      {!loading ? (
        <CheckOutlinedIcon
          fontSize="small"
          color="secondary"
          sx={{ cursor: "pointer" }}
          onClick={onSuccess}
        />
      ) : (
        <CircularProgress size={18} />
      )}
    </Stack>
  );
}
