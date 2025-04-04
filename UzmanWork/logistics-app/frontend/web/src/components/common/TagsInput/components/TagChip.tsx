import { type AutocompleteGetTagProps, Chip } from "@mui/material";
import { useVisibilityChange } from "common/hooks";

interface TagChipProps extends ReturnType<AutocompleteGetTagProps> {
  tag: string;
  showDelete: boolean;
  onVisibilityChange: (isVisible: boolean) => void;
}

export function TagChip({
  tag,
  showDelete,
  onDelete,
  onVisibilityChange,
}: TagChipProps) {
  const [ref] = useVisibilityChange<HTMLDivElement>(onVisibilityChange);

  return (
    <Chip
      label={tag}
      size="small"
      onDelete={onDelete}
      sx={(theme) => ({
        bgcolor: "#F0F3FB !important",
        color: theme.palette.primary.main,
        "& .MuiChip-deleteIcon": {
          display: showDelete ? "block" : "none",
          color: `${theme.palette.primary.main} !important`,
        },
      })}
      ref={ref}
    />
  );
}
