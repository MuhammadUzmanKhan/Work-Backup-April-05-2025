import {
  Box,
  ButtonGroup,
  ClickAwayListener,
  IconButton,
  TextField,
  useTheme,
} from "@mui/material";
import { type KeyboardEvent } from "react";
import {
  CheckOutlined as CheckOutlinedIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { MountIf } from "coram-common-utils";
import { EditableTextFieldProps } from "./types";
import { useTextField } from "./hooks";

const BUTTONS_WIDTH = "85px";

export function EditableTextField({
  value,
  onChange,
  editable = true,
  placeholder = "",
  width = "100%",
  variant = "body1",
  maxLength,
}: EditableTextFieldProps) {
  const theme = useTheme();

  const {
    inputRef,
    isEditing,
    setIsEditing,
    editedValue,
    setEditedValue,
    handleSave,
    handleCancel,
  } = useTextField(value, onChange);

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      handleSave();
    }
  }

  return (
    <ClickAwayListener onClickAway={handleSave}>
      <Box gap={1} position="relative" width={width}>
        <TextField
          variant="outlined"
          fullWidth
          onClick={() => setIsEditing(true)}
          placeholder={placeholder}
          value={editedValue}
          onChange={(e) => setEditedValue(e.target.value)}
          onKeyDown={handleKeyDown}
          inputProps={{
            maxLength,
          }}
          InputProps={{
            readOnly: editable && !isEditing,
            sx: {
              "& input": {
                ...theme.typography[variant],
                padding: "8px 8px",
                maxWidth: `calc(100% - ${BUTTONS_WIDTH})`,
              },
            },
          }}
          sx={(theme) => ({
            cursor: "text",
            border: "1px solid transparent",
            ...(!isEditing && {
              "& input": {
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                overflow: "hidden",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                border: "1px solid transparent !important",
              },
              "&:hover": {
                backgroundColor: theme.palette.inputsBackgroundHover.main,
                ".MuiOutlinedInput-notchedOutline": {
                  border: "1px solid transparent !important",
                },
              },
            }),
          })}
          ref={inputRef}
        />
        <MountIf condition={isEditing}>
          <ButtonGroup
            onClick={(e) => e.stopPropagation()}
            sx={{
              position: "absolute",
              height: "100%",
              transform: "translate(-110%, 0)",
              bottom: 0,
              zIndex: 1,
            }}
          >
            <IconButton onClick={handleSave} sx={{ p: 0.5 }}>
              <CheckOutlinedIcon color="secondary" fontSize="small" />
            </IconButton>
            <IconButton onClick={handleCancel} sx={{ p: 0.5 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </ButtonGroup>
        </MountIf>
      </Box>
    </ClickAwayListener>
  );
}
