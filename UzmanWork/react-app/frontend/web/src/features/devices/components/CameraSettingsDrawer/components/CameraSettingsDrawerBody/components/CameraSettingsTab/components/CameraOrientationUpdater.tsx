import { MenuItem, Stack, Typography } from "@mui/material";
import { DevicesService, VideoOrientationType } from "coram-common-utils";
import { KeyboardArrowDown as KeyboardArrowDownIcon } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { StyledSelect } from "components/styled_components/StyledSelect";

const orientationOptions = [
  {
    id: VideoOrientationType.ORIENTATION_IDENTITY,
    name: "No Rotation",
  },
  {
    id: VideoOrientationType.ORIENTATION90R,
    name: "90° Right",
  },
  {
    id: VideoOrientationType.ORIENTATION180,
    name: "180°",
  },
  {
    id: VideoOrientationType.ORIENTATION90L,
    name: "90° Left",
  },
];

interface CameraOrientationUpdaterProps {
  videoOrientationType: VideoOrientationType;
  macAddress: string;
  stackProps?: Parameters<typeof Stack>[0];
  onSuccessfulUpdate?: () => void;
  disabled: boolean;
}

export function CameraOrientationUpdater({
  videoOrientationType,
  macAddress,
  stackProps,
  onSuccessfulUpdate,
  disabled,
}: CameraOrientationUpdaterProps) {
  const [videoOrientationTypeInternal, setVideoOrientationTypeInternal] =
    useState<VideoOrientationType>(videoOrientationType);
  const [loading, setLoading] = useState<boolean>(false);
  const [onError, setOnError] = useState<boolean>(false);

  useEffect(
    () => setVideoOrientationTypeInternal(videoOrientationType),
    [videoOrientationType]
  );

  const orientationItems = Array.from(orientationOptions).map((ori) => (
    <MenuItem key={ori.id} value={ori.id}>
      {ori.name}
    </MenuItem>
  ));

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      {...stackProps}
    >
      <Typography variant="body1" color="textSecondary">
        Rotation:
      </Typography>
      <Stack gap={1} direction="row" alignItems="center">
        {onError && (
          <Typography variant="body2" color="error">
            Error
          </Typography>
        )}
        <StyledSelect
          value={videoOrientationTypeInternal}
          disabled={disabled || loading || onError}
          IconComponent={(props) => (
            <KeyboardArrowDownIcon {...props} fontSize="small" />
          )}
          onChange={async (ev) => {
            setLoading(true);
            const oldType = videoOrientationTypeInternal;
            try {
              // Optimistic update
              const newType = ev.target.value as VideoOrientationType;
              setVideoOrientationTypeInternal(newType);
              await DevicesService.updateCameraVideoOrientationType({
                mac_address: macAddress,
                video_orientation_type: newType,
              });
              onSuccessfulUpdate?.();
            } catch (e) {
              console.error(e);
              // Revert optimistic update
              setVideoOrientationTypeInternal(oldType);
              setOnError(true);
              setTimeout(() => setOnError(false), 2000);
            }
            setLoading(false);
          }}
          displayEmpty
          sx={{
            width: "8rem",
            "& .MuiSelect-outlined": {
              py: 0.4,
            },
          }}
        >
          {orientationItems}
        </StyledSelect>
      </Stack>
    </Stack>
  );
}
