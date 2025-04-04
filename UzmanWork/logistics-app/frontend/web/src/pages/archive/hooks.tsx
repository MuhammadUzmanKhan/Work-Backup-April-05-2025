import { useArchives } from "hooks/archive_page";
import { useMemo } from "react";

export function useArchivesSorted() {
  const query = useArchives();

  const sortedArchives = useMemo(
    () =>
      query.data.sort(
        (a1, a2) => a2.creation_time.toMillis() - a1.creation_time.toMillis()
      ),
    [query.data]
  );

  return {
    ...query,
    data: sortedArchives,
  };
}
