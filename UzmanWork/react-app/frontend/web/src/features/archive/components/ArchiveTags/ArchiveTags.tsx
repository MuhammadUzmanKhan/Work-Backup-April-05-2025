import { TagsInput } from "components/common";
import { useCreateTag, useTags } from "features/tags/hooks";
import { TagResponse } from "coram-common-utils";
import { useSetArchiveTags } from "./hooks";

interface ArchiveTagsProps {
  archiveId: number;
  archiveTags: TagResponse[];
  refetchArchives?: () => Promise<unknown>;
  editable?: boolean;
  maxLines?: number;
}

export function ArchiveTags({
  archiveId,
  archiveTags,
  refetchArchives,
  editable = true,
  maxLines,
}: ArchiveTagsProps) {
  const { isLoading: isLoadingTags, data: tags } = useTags();
  const { isLoading: isSettingTags, mutateAsync: setArchiveTags } =
    useSetArchiveTags();

  const { isLoading: isCreatingTag, mutateAsync: createTag } = useCreateTag();

  async function updateArchiveTags(tags: TagResponse[]) {
    await setArchiveTags({ archiveId, tagIds: tags.map((tag) => tag.id) });
    await refetchArchives?.();
  }

  return (
    <TagsInput
      selectedTags={archiveTags}
      onTagsChange={updateArchiveTags}
      availableTags={tags}
      onCreateTag={async (name) => createTag(name)}
      isLoading={isLoadingTags || isSettingTags || isCreatingTag}
      editable={editable}
      maxLines={maxLines}
    />
  );
}
