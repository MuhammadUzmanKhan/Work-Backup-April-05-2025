import { Button, CircularProgress, Stack, Typography } from "@mui/material";
import { CandidateCamera } from "../../types";
import {
  InfoOutlined as InfoOutlinedIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";

interface FooterProps {
  candidateCameras: CandidateCamera[];
  numTotalSlots: number;
  onActivateClick: () => Promise<void>;
  disabled: boolean;
  isRegistrationInProgress: boolean;
}

export function Footer({
  candidateCameras,
  numTotalSlots,
  onActivateClick,
  disabled,
  isRegistrationInProgress,
}: FooterProps) {
  const numCamerasSelected = candidateCameras.filter(
    (candidate) => candidate.selected
  ).length;

  const tooManyCamerasSelected = numCamerasSelected > numTotalSlots;

  return (
    <Stack
      direction="row"
      width="100%"
      justifyContent="space-between"
      alignItems="center"
      gap={1}
    >
      <Stack direction="row" gap={1} alignItems="center">
        {!tooManyCamerasSelected ? (
          <>
            <InfoOutlinedIcon sx={{ fontSize: "1.2rem" }} />
            <Typography variant="body2">
              {numCamerasSelected} cameras selected. You can select{" "}
              {numTotalSlots - numCamerasSelected} more cameras.
            </Typography>
          </>
        ) : (
          <>
            <WarningIcon sx={{ fontSize: "1.2rem" }} color="warning" />
            <Typography variant="body2">
              You have selected more than {numTotalSlots} cameras. Please remove{" "}
              {numCamerasSelected - numTotalSlots} cameras to proceed.
            </Typography>
          </>
        )}
      </Stack>

      <Stack direction="row" gap={1} alignItems="center">
        {isRegistrationInProgress && (
          <CircularProgress color="secondary" size={25} />
        )}

        <Button
          disabled={
            disabled || isRegistrationInProgress || tooManyCamerasSelected
          }
          variant="contained"
          color="secondary"
          onClick={onActivateClick}
        >
          Activate
        </Button>
      </Stack>
    </Stack>
  );
}
