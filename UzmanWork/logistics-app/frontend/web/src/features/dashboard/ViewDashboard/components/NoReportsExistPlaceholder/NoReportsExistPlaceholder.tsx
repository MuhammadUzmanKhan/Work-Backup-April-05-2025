import { CenteredStack } from "components/styled_components/CenteredStack";
import { NoReportsIcon } from "./NoReportsIcon";
import { Stack, Typography } from "@mui/material";

export function NoReportsExistPlaceholder() {
  return (
    <CenteredStack gap={2.5}>
      <NoReportsIcon />
      <Stack justifyContent="center" alignItems="center" gap={1}>
        <Typography variant="h2">You haven’t added any report yet</Typography>
        <Typography variant="body2">
          Click Add Report button to create one.
        </Typography>
      </Stack>
    </CenteredStack>
  );
}
