import { Check as CheckIcon, Error as ErrorIcon } from "@mui/icons-material";
import { CircularProgress, Stack, Typography } from "@mui/material";

export enum DialogStatus {
  INITIAL = "INITIAL",
  LOADING = "LOADING",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

export function DialogRenderStatusInfo({ status }: { status: DialogStatus }) {
  if (status === DialogStatus.SUCCESS) {
    return (
      <Stack direction="row" alignItems="center">
        <CheckIcon fontSize="medium" color="success" />
        <Typography variant="body2" color="secondary">
          Link shared
        </Typography>
      </Stack>
    );
  } else if (status === DialogStatus.ERROR) {
    return (
      <Stack direction="row" alignItems="center">
        <ErrorIcon fontSize="medium" color="error" />
        <Typography variant="body2" color="error">
          Something went wrong. Please try again later.
        </Typography>
      </Stack>
    );
  } else if (status === DialogStatus.LOADING) {
    return <CircularProgress size={24} />;
  } else {
    return <></>;
  }
}
