import { Box, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { NameEdit } from "components/common/NameEdit";
import { EditIcon } from "icons";
import { ActionButton } from "components/styled_components/ActionButton";

const MAX_DESCRIPTION_LENGTH = 200;

interface ArchiveDescriptionEditorProps {
  description: string;
  onDescriptionChange: (description: string) => Promise<void>;
}

export function ArchiveDescriptionEditor({
  description,
  onDescriptionChange,
}: ArchiveDescriptionEditorProps) {
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isHoveringDescription, setIsHoveringDescription] = useState(false);

  const hasDescription = description.length > 0;

  return (
    <Box minHeight="35px" display="flex" alignItems="center">
      {isEditingDescription ? (
        <NameEdit
          prevName={description}
          setIsEditing={setIsEditingDescription}
          onSubmit={onDescriptionChange}
          maxNameLength={MAX_DESCRIPTION_LENGTH}
          fullWidth={true}
        />
      ) : (
        <Stack
          onMouseEnter={() => setIsHoveringDescription(true)}
          onMouseLeave={() => setIsHoveringDescription(false)}
          direction="row"
          alignItems="center"
          gap={1}
        >
          <Typography
            variant="body1"
            color={hasDescription ? "text.primary" : "text.secondary"}
          >
            {hasDescription
              ? description
              : "This archive doesn't have a description yet. Click to edit .."}
          </Typography>

          <ActionButton
            onClick={() => {
              setIsEditingDescription(true);
              setIsHoveringDescription(false);
            }}
          >
            {isHoveringDescription && (
              <EditIcon
                fontSize="small"
                sx={{ color: "text.secondary", width: "16px", height: "16px" }}
              />
            )}
          </ActionButton>
        </Stack>
      )}
    </Box>
  );
}
