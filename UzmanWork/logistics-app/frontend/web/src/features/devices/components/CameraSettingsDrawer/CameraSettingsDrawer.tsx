import { Divider, Drawer, IconButton, Stack, Typography } from "@mui/material";
import {
  CameraSettingsDrawerBody,
  CameraSettingsDrawerHeader,
} from "./components";
import { CameraResponse, ThumbnailResponse } from "coram-common-utils";
import { QueryObserverResult } from "react-query";
import { Close as CloseIcon } from "@mui/icons-material";

interface CameraSettingsDrawerProps {
  open: boolean;
  stream: CameraResponse;
  thumbnail: ThumbnailResponse | undefined;
  refetchCameras: () => Promise<QueryObserverResult<CameraResponse[]>>;
  onClose: () => void;
}

export function CameraSettingsDrawer({
  open,
  stream,
  thumbnail,
  refetchCameras,
  onClose,
}: CameraSettingsDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      PaperProps={{
        sx: {
          width: "70%",
          p: 2,
          gap: 2,
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        width="100%"
      >
        <Typography variant="h2">Settings</Typography>
        <IconButton onClick={onClose} sx={{ p: 0 }}>
          <CloseIcon />
        </IconButton>
      </Stack>
      <Divider sx={{ width: "100%" }} />
      <Stack width="100%" gap={1}>
        <CameraSettingsDrawerHeader
          camera={stream.camera}
          thumbnail={thumbnail}
          onClose={onClose}
        />
        <CameraSettingsDrawerBody
          camera={stream}
          refetchCameras={refetchCameras}
        />
      </Stack>
    </Drawer>
  );
}
