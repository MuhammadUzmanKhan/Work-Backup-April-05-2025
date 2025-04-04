import type { StackProps } from "@mui/material";
import { Stack, Typography } from "@mui/material";
import { NoResultsIcon } from "icons";

export interface NoResultFoundPlaceholderProps extends StackProps {
  text?: string;
}

export function NoResultFoundPlaceholder({
  text = "No result found",
  ...rest
}: NoResultFoundPlaceholderProps) {
  return (
    <Stack alignItems="center" justifyContent="center" gap={3} {...rest}>
      <NoResultsIcon />
      <Typography variant="h3" fontSize="16px" sx={{ userSelect: "none" }}>
        {text}
      </Typography>
    </Stack>
  );
}
