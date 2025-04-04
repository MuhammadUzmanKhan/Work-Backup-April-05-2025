import {
  Delete as DeleteIcon,
  ErrorOutlineOutlined as ErrorOutlineOutlinedIcon,
} from "@mui/icons-material";
import { CircularProgress, IconButton, Stack, Typography } from "@mui/material";
import type { SxProps } from "@mui/material";
import React from "react";

interface RemoveButtonProps {
  deleteMember: () => Promise<void>;
  onSuccessfulDelete?: () => void;
  sx?: SxProps;
}

export function RemoveMemberButton({
  deleteMember,
  onSuccessfulDelete,
  sx,
}: RemoveButtonProps) {
  const [isDeleteLoading, setIsDeleteLoading] = React.useState(false);
  const [isDeleteError, setIsDeleteError] = React.useState(false);

  const handleRemove = async () => {
    if (isDeleteLoading || isDeleteError) {
      return;
    }
    try {
      setIsDeleteLoading(true);
      await deleteMember();
      onSuccessfulDelete?.();
    } catch (ex) {
      console.error(ex);
      setIsDeleteError(true);
      setTimeout(() => setIsDeleteError(false), 4000);
    } finally {
      setIsDeleteLoading(false);
    }
  };

  return (
    <IconButton
      onClick={handleRemove}
      sx={{
        minWidth: 200,
        "&:hover": {
          backgroundColor: "rgba(0, 0, 0, 0.04)",
          cursor: "pointer",
        },
        ...sx,
      }}
      size="small"
    >
      <DeleteIcon />
      <Stack direction="row" gap={2} alignItems="center">
        {isDeleteError && (
          <CircularProgress size={18} sx={{ color: "white" }} />
        )}
        {isDeleteError && <ErrorOutlineOutlinedIcon sx={{ color: "white" }} />}

        <Typography
          variant="body2"
          sx={{
            color: "neutral.1000",
            fontWeight: 500,
            px: 0,
          }}
        >
          {isDeleteLoading ? "Removing" : "Remove"}
        </Typography>
      </Stack>
    </IconButton>
  );
}
