import { Stack, Typography } from "@mui/material";

interface SearchSummaryProps {
  totalResults: number;
  resetFilters: VoidFunction;
}

export function SearchSummary({
  totalResults,
  resetFilters,
}: SearchSummaryProps) {
  return (
    <Stack direction="row">
      <Typography
        variant="body1"
        sx={{
          p: "1rem 0.4rem 0 0.4rem",
        }}
      >
        {totalResults} result found
      </Typography>
      <Typography
        sx={{
          color: "primary.main",
          fontWeight: 600,
          p: "1rem 0.4rem 0 0.4rem",
          cursor: "pointer",
        }}
        onClick={() => resetFilters()}
      >
        Clear
      </Typography>
    </Stack>
  );
}
