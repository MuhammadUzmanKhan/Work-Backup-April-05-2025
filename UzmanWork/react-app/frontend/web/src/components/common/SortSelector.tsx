import {
  type SelectProps,
  Stack,
  Typography,
  Select,
  MenuItem,
  type SelectChangeEvent,
} from "@mui/material";

export type SortOrder = "asc" | "desc";
type SortSelectorProps = SelectProps & {
  value: SortOrder | undefined;
  onChange: (ev: SelectChangeEvent<unknown>) => void;
};

export function SortSelector({ value, onChange, ...props }: SortSelectorProps) {
  return (
    <Stack flexDirection="row" alignItems="center" columnGap={1}>
      <Typography variant="body2" flexShrink={0}>
        Sort by:
      </Typography>
      <Select value={value} onChange={onChange} {...props}>
        <MenuItem value="asc">Ascending</MenuItem>
        <MenuItem value="desc">Descending</MenuItem>
      </Select>
    </Stack>
  );
}
