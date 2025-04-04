import { Stack, TextField } from "@mui/material";
import { useState } from "react";
import { TagResponse } from "coram-common-utils";
import { TimeInterval } from "utils/time";
import { TagsInput } from "components/common";
import { LoadingButton } from "@mui/lab";
import { useCreateTag, useTags } from "features/tags/hooks";
import { useCreateArchive } from "../hooks";

interface CreateNewArchiveProps {
  macAddress: string;
  clipTimeInterval: TimeInterval;
  hasErrors: boolean;
  onClose: VoidFunction;
}

export function CreateNewArchive({
  macAddress,
  clipTimeInterval,
  hasErrors,
  onClose,
}: CreateNewArchiveProps) {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [tags, setTags] = useState<TagResponse[]>([]);

  const { data: availableTags } = useTags();
  const { isLoading: isCreatingTag, mutateAsync: createTag } = useCreateTag();

  const { isLoading: isCreationPending, mutateAsync: createArchive } =
    useCreateArchive(onClose);

  const isFormInValid = hasErrors || title.length === 0;

  return (
    <>
      <Stack gap={2} flexGrow={1}>
        <TextField
          placeholder="Archive Name"
          required={true}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{
            input: { py: "11.5px" },
          }}
        />
        <TagsInput
          selectedTags={tags}
          onTagsChange={async (newTags) => setTags(newTags)}
          availableTags={availableTags}
          onCreateTag={createTag}
          isLoading={isCreatingTag}
          editable={true}
        />
        <TextField
          placeholder="Archive Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          rows={2}
        />
      </Stack>
      <LoadingButton
        variant="contained"
        disabled={isFormInValid}
        color="secondary"
        onClick={() =>
          createArchive({
            title,
            description,
            macAddress,
            clipTimeInterval,
            tagsIds: tags.map((tag) => tag.id),
          })
        }
        fullWidth={true}
        loading={isCreationPending}
      >
        Archive
      </LoadingButton>
    </>
  );
}
