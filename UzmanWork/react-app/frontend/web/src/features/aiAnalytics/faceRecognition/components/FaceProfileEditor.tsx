import { Stack, Typography } from "@mui/material";
import { Edit as EditIcon } from "@mui/icons-material";
import { StyledEditableTextField } from "components/styled_components/StyledEditableTextField";

interface FaceProfileEditorProps {
  name: string;
  editMode: boolean;
  onEditClick: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (name: string) => void;
  onInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FaceProfileEditor({
  name,
  editMode,
  onEditClick,
  onCancelEdit,
  onSaveEdit,
  onInputChange,
}: FaceProfileEditorProps) {
  return (
    <>
      {editMode ? (
        <StyledEditableTextField
          value={name}
          onChange={onInputChange}
          onCancelEdit={onCancelEdit}
          onSaveEdit={() => onSaveEdit(name)}
          sx={{
            input: { color: "neutral.600", fontSize: "14px" },
            maxWidth: "120px",
          }}
        />
      ) : (
        <Stack direction="row" alignItems="center" gap={1}>
          <Typography variant="body1">{name}</Typography>
          <EditIcon fontSize="small" color="primary" onClick={onEditClick} />
        </Stack>
      )}
    </>
  );
}
