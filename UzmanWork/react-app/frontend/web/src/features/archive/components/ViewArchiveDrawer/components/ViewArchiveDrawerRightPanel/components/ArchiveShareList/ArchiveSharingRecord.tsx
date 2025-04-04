import { Avatar, CircularProgress, Stack, Typography } from "@mui/material";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import { useState } from "react";
import { ActionButton } from "components/styled_components/ActionButton";
import { useUnshareArchive } from "./hooks";

interface ArchiveSharingRecordProps {
  archiveId: number;
  email: string;
  refetchArchives: () => Promise<unknown>;
}

export function ArchiveSharingRecord({
  archiveId,
  email,
  refetchArchives,
}: ArchiveSharingRecordProps) {
  const [isHoveringShare, setIsHoveringShare] = useState(false);

  const { isLoading: isUnsharingPending, mutateAsync: unshareArchive } =
    useUnshareArchive(refetchArchives);

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={1}
      borderRadius="50px"
      bgcolor="common.white"
      onMouseEnter={() => setIsHoveringShare(true)}
      onMouseLeave={() => setIsHoveringShare(false)}
    >
      <Avatar
        sx={{
          bgcolor: "neutral.200",
          color: "common.black",
          fontSize: "16px",
          width: "24px",
          height: "24px",
        }}
      >
        <Typography variant="body2">
          {(email[0] ?? "U").toUpperCase()}
        </Typography>
      </Avatar>
      <Typography variant="body2">{email}</Typography>
      <ActionButton
        onClick={() => unshareArchive({ archiveId, email })}
        disabled={!isHoveringShare}
        sx={{
          minWidth: "2rem",
          opacity: isUnsharingPending || isHoveringShare ? 1 : 0,
        }}
      >
        {isUnsharingPending ? (
          <CircularProgress color="primary" size={16} />
        ) : (
          <CancelOutlinedIcon fontSize="small" />
        )}
      </ActionButton>
    </Stack>
  );
}
