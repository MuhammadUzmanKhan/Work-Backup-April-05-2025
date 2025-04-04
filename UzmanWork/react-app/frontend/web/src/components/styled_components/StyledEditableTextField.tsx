import { TextField, InputAdornment, ClickAwayListener } from "@mui/material";
import type { TextFieldProps } from "@mui/material";
import {
  CheckOutlined as CheckOutlinedIcon,
  CloseOutlined as CloseOutlinedIcon,
} from "@mui/icons-material";

interface StyledEditableTextFieldProps {
  onCancelEdit: () => void;
  onSaveEdit: () => void;
}

export function StyledEditableTextField({
  onCancelEdit,
  onSaveEdit,
  ...props
}: StyledEditableTextFieldProps & TextFieldProps) {
  return (
    <ClickAwayListener onClickAway={onSaveEdit}>
      <TextField
        {...props}
        autoFocus
        required
        variant="standard"
        type="text"
        onKeyDown={(ev) => {
          if (ev.key !== "Enter") {
            return;
          }
          onSaveEdit();
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <CloseOutlinedIcon
                fontSize="small"
                color="disabled"
                sx={{ cursor: "pointer" }}
                onClick={() => onCancelEdit()}
              />
              <CheckOutlinedIcon
                fontSize="small"
                color="secondary"
                sx={{ cursor: "pointer" }}
                onClick={() => onSaveEdit()}
              />
            </InputAdornment>
          ),
        }}
      />
    </ClickAwayListener>
  );
}
