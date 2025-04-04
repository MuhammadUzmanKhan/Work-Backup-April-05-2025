import { Stack, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { TimeInterval } from "utils/time";
import { LoadingButton } from "@mui/lab";
import { useAddClipToExistingArchive } from "../hooks";
import { ArchiveSummaryResponse, NonEmptyArray } from "coram-common-utils";
import { StyledAutocomplete } from "components/styled_components/StyledAutocomplete";

interface AddClipToExistingArchiveProps {
  archives: NonEmptyArray<ArchiveSummaryResponse>;
  macAddress: string;
  clipTimeInterval: TimeInterval;
  hasErrors: boolean;
  onClose: VoidFunction;
}

export function AddClipToExistingArchive({
  archives,
  macAddress,
  clipTimeInterval,
  hasErrors,
  onClose,
}: AddClipToExistingArchiveProps) {
  const [selectedArchive, setSelectedArchive] = useState({
    label: toArchiveLabel(archives[0]),
    id: archives[0].id,
  });

  const [comment, setComment] = useState("");

  const { isLoading: isAddingClipPending, mutateAsync: addClipToArchive } =
    useAddClipToExistingArchive(onClose);

  const sortedArchives = useMemo(
    () => archives.sort((a, b) => a.id - b.id),
    [archives]
  );

  return (
    <>
      <Stack gap={2} flexGrow={1}>
        <StyledAutocomplete
          onChange={(_, value) => setSelectedArchive(value)}
          value={selectedArchive}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          noOptionsText={
            <Typography fontSize="13px">No Archives found</Typography>
          }
          disableClearable
          options={sortedArchives.map((archive) => ({
            label: toArchiveLabel(archive),
            id: archive.id,
          }))}
          fullWidth
        />
        <TextField
          placeholder="Add Comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          multiline
          rows={2}
        />
      </Stack>
      <LoadingButton
        variant="contained"
        color="secondary"
        disabled={hasErrors}
        onClick={() =>
          addClipToArchive({
            archiveId: selectedArchive.id,
            comment,
            macAddress,
            clipTimeInterval,
          })
        }
        fullWidth={true}
        loading={isAddingClipPending}
      >
        Add Clip to Archive
      </LoadingButton>
    </>
  );
}

function toArchiveLabel(archive: ArchiveSummaryResponse) {
  return "ID: " + archive.id + " " + archive.title;
}
