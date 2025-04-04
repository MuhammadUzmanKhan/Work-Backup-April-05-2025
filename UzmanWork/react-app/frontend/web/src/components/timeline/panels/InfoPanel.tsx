import { Box, Stack, Typography } from "@mui/material";
import { CameraResponse } from "coram-common-utils";
import { PanelHeader } from "../common_panel/PanelHeader";
import {
  PanelContainer,
  PanelContainerProps,
} from "../common_panel/PanelContainer";
import CopyToClipboardButton from "components/CopyToClipboardButton";

interface InfoPanelProps {
  onCloseClick: () => void;
  currentStream: CameraResponse;
  containerProps?: PanelContainerProps;
}

export function InfoPanel({
  onCloseClick,
  currentStream,
  containerProps,
}: InfoPanelProps) {
  const { mac_address, ip, nvr_uuid } = currentStream.camera;
  const clipboardText = `Location: ${currentStream.location}
  Group Name: ${currentStream.group_name}
  MAC Address: ${mac_address}
  Camera IP: ${ip}
  CVR ID: ${nvr_uuid}
  FPS: ${currentStream.camera.fps}
  Resolution: ${currentStream.camera.width} x ${currentStream.camera.height}
  Bit Rate: ${currentStream.camera.bitrate_kbps}
  Codec: ${currentStream.camera.codec} `;

  return (
    <PanelContainer {...containerProps}>
      <PanelHeader title="INFO" onCloseClick={onCloseClick} />
      <Stack flexDirection="row">
        <Stack
          p={1}
          rowGap="0.4rem"
          flexGrow={1}
          sx={{
            wordBreak: "break-word",
          }}
        >
          <Typography variant="body2">
            Location:{currentStream.location}
          </Typography>
          <Typography variant="body2">
            Group Name: {currentStream.group_name}
          </Typography>
          <Typography variant="body2">
            MAC Address: {currentStream.camera.mac_address}
          </Typography>
          <Typography variant="body2">
            Camera IP: {currentStream.camera.ip}
          </Typography>
          <Typography variant="body2">
            CVR ID: {currentStream.camera.nvr_uuid}
          </Typography>
          <Typography variant="body2">
            FPS: {currentStream.camera.fps}
          </Typography>
          <Typography variant="body2">
            Resolution:
            {` ${currentStream.camera.width} x ${currentStream.camera.height}`}
          </Typography>
          <Typography variant="body2">
            Bit Rate: {currentStream.camera.bitrate_kbps} kbps
          </Typography>
          <Typography variant="body2">
            Codec: {currentStream.camera.codec}
          </Typography>
        </Stack>
        <Box p={1.5}>
          <CopyToClipboardButton
            clipboardText={clipboardText}
            color="secondary.main"
          />
        </Box>
      </Stack>
    </PanelContainer>
  );
}
