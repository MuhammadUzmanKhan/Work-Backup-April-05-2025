import { Button, Divider, Stack, Typography } from "@mui/material";
import { forwardRef, Ref, useState } from "react";
import { ArchiveActions } from "./components";
import {
  EditableTextField,
  MultilineEditableTextField,
} from "components/common";
import { MountIf } from "coram-common-utils";
import { useIsLimitedUser } from "components/layout/RoleGuards";
import { useAuth0 } from "@auth0/auth0-react";
import { isDefined } from "utils/types";
import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { useUpdateArchiveDescription, useUpdateArchiveTitle } from "./hooks";
import { MAX_ARCHIVE_TITLE_LENGTH } from "./consts";

interface ArchiveInfoProps {
  archiveId: number;
  title: string;
  description: string;
  archiveOwner: string;
  allowEdit: boolean;
  refetchArchives: () => Promise<unknown>;
  onDrawerClose: () => void;
}

export const ArchiveInfo = forwardRef(function ArchiveInfo(
  {
    archiveId,
    title,
    description,
    archiveOwner,
    allowEdit,
    refetchArchives,
    onDrawerClose,
  }: ArchiveInfoProps,
  ref: Ref<HTMLDivElement>
) {
  const { user } = useAuth0();

  const allowShare = useIsLimitedUser();
  const allowDeletion = user?.email === archiveOwner;

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const { mutate: updateTitle } = useUpdateArchiveTitle(refetchArchives);
  const { mutate: updateDescription } =
    useUpdateArchiveDescription(refetchArchives);

  return (
    <Stack gap={1} width="100%" ref={ref}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        gap={2}
      >
        <EditableTextField
          value={title}
          onChange={(title) => updateTitle({ archiveId, title })}
          variant="h2"
          maxLength={MAX_ARCHIVE_TITLE_LENGTH}
          editable={allowEdit}
        />
        <MountIf condition={allowShare || allowDeletion}>
          <Button
            size="small"
            color="secondary"
            variant="contained"
            onClick={(ev) => setAnchorEl(ev.currentTarget)}
            sx={{ height: "32px", width: "104px", borderRadius: "4px" }}
            endIcon={
              isDefined(anchorEl) ? (
                <ExpandLessIcon fontSize="small" />
              ) : (
                <ExpandMoreIcon fontSize="small" />
              )
            }
          >
            <Typography variant="body1">Actions</Typography>
          </Button>
          <ArchiveActions
            anchorEl={anchorEl}
            allowShare={allowShare}
            allowDeletion={allowDeletion}
            archiveId={archiveId}
            refetchArchives={refetchArchives}
            onMenuClose={() => setAnchorEl(null)}
            onDelete={onDrawerClose}
          />
        </MountIf>
      </Stack>
      <Divider />
      <MultilineEditableTextField
        value={description}
        onChange={(description) =>
          updateDescription({ archiveId, description })
        }
        variant="body1"
        placeholder="Click to add a description"
        editable={allowEdit}
      />
    </Stack>
  );
});
