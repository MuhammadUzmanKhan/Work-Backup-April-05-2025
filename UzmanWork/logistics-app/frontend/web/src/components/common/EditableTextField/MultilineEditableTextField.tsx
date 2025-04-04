import {
  Box,
  Button,
  ClickAwayListener,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { isDefined } from "utils/types";
import { MountIf } from "coram-common-utils";
import { EditableTextFieldProps } from "./types";
import { useTextField } from "./hooks";

interface MultilineEditableTextFieldProps extends EditableTextFieldProps {
  rows?: number;
  maxRows?: number;
}

export function MultilineEditableTextField({
  value,
  onChange,
  editable = true,
  placeholder = "",
  width = "100%",
  rows,
  maxRows,
  variant = "body1",
}: MultilineEditableTextFieldProps) {
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

  return (
    <ClickAwayListener onClickAway={handleSave}>
      <Box gap={1} position="relative" width={width}>
        <TextField
          variant="outlined"
          fullWidth
          onClick={() => setIsEditing(true)}
          multiline={true}
          rows={isDefined(maxRows) ? undefined : rows}
          maxRows={maxRows}
          placeholder={placeholder}
          value={editedValue}
          onChange={(e) => setEditedValue(e.target.value)}
          InputProps={{
            readOnly: editable && !isEditing,
            sx: {
              "& textarea": {
                ...theme.typography[variant],
                padding: 0,
              },
            },
          }}
          sx={(theme) => ({
            cursor: "text",
            border: "1px solid transparent",
            ...(!isEditing && {
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
          <Stack gap={1} direction="row" pt={1}>
            <Button
              size="small"
              color="secondary"
              variant="contained"
              onClick={handleSave}
              sx={{ height: "32px", width: "70px", borderRadius: "4px" }}
            >
              <Typography variant="body1">Save</Typography>
            </Button>
            <Button variant="text" size="small" onClick={handleCancel}>
              <Typography variant="body1" color="text.primary">
                Cancel
              </Typography>
            </Button>
          </Stack>
        </MountIf>
      </Box>
    </ClickAwayListener>
  );
}
