import {
  Box,
  type SxProps,
  useTheme,
  Stack,
  CircularProgress,
} from "@mui/material";
import { ThumbnailResponse } from "coram-common-utils";
import { VideocamOff as VideocamOffIcon } from "@mui/icons-material";
import { InfoBox } from "components/video/InfoBox";
import { CameraOffline as CameraOfflineIcon } from "icons/camera-offline";
import { useImageLoadStatus } from "hooks/useImageLoaded";

interface ThumbnailViewerProps {
  macAddress: string;
  thumbnail: ThumbnailResponse | undefined;
  cameraIsOnline: boolean;
  onClick?: () => void;
  width?: number;
  height?: number;
  sx?: SxProps;
}

export function ThumbnailViewer({
  macAddress,
  thumbnail,
  cameraIsOnline,
  onClick,
  width = 100,
  height = 81.5,
  sx,
}: ThumbnailViewerProps) {
  // Mui theme
  const theme = useTheme();
  const { data: imageUrl, status } = useImageLoadStatus(
    macAddress,
    thumbnail?.s3_signed_url
  );

  return (
    <Stack
      width={width}
      height={height}
      sx={{
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "6px",
        overflow: "hidden",
        cursor: "pointer",
        backgroundColor: "common.black",
        "&:hover": {
          filter: "brightness(0.9)",
        },
        ...sx,
      }}
      onClick={onClick}
    >
      {status === "idle" && (
        <InfoBox
          icon={<VideocamOffIcon sx={{ color: theme.palette.common.white }} />}
        />
      )}
      {status === "loading" && <CircularProgress color="secondary" size={25} />}
      {status === "success" && (
        <>
          {cameraIsOnline ? (
            <Box component="img" src={imageUrl} maxWidth="100%" height="100%" />
          ) : (
            <InfoBox
              icon={
                <CameraOfflineIcon sx={{ color: theme.palette.common.white }} />
              }
              backgroundImage={imageUrl}
            />
          )}
        </>
      )}
    </Stack>
  );
}
