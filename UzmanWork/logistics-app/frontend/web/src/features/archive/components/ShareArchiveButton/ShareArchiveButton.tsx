import { Button, Typography } from "@mui/material";
import { useState } from "react";
import { ShareArchiveIcon } from "./ShareArchiveIcon";
import { ShareArchiveDialog } from "../ShareArchiveDialog";

interface ShareArchiveButtonProps {
  archiveId: number;
  refetchArchives: () => Promise<unknown>;
}

export function ShareArchiveButton({
  archiveId,
  refetchArchives,
}: ShareArchiveButtonProps) {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <>
      <Button
        variant="text"
        onClick={() => setShareOpen(true)}
        sx={{ p: 0, color: "primary.light", width: "70px" }}
        startIcon={<ShareArchiveIcon sx={{ width: "24px", height: "24px" }} />}
      >
        <Typography variant="body2" color="primary.light">
          Share
        </Typography>
      </Button>
      <ShareArchiveDialog
        archiveId={archiveId}
        open={shareOpen}
        setShareOpen={setShareOpen}
        refetchArchives={refetchArchives}
      />
    </>
  );
}
