import { Box, Stack, TableCell, TableRow } from "@mui/material";
import { PLAYER_OPTIONS_NO_INTERACTIONS } from "utils/player_options";
import {
  CameraResponse,
  LOW_RESOLUTION_CONFIG,
  useKeepLiveVideosAlive,
  useMostRecentThumbnailsEnlarged,
  useStoreLiveStreamResponses,
} from "coram-common-utils";
import { VideoPlayer } from "components/video/VideoPlayer";

interface AccessPointCamerasLiveVideosTableRowProps {
  cameras: CameraResponse[];
}

const VIDEO_PLAYER_OPTIONS = {
  hideStreamName: true,
  htmlPlayerOptions: PLAYER_OPTIONS_NO_INTERACTIONS,
  isLiveStream: true,
  hideLiveIndicator: false,
  hideTime: true,
};

export function AccessPointCamerasLiveVideosTableRow({
  cameras,
}: AccessPointCamerasLiveVideosTableRowProps) {
  const { liveResponsesMap, addLiveStreamResponse, removeLiveStreamResponse } =
    useStoreLiveStreamResponses();

  useKeepLiveVideosAlive(liveResponsesMap, { enabled: true });

  const { data: mostRecentThumbnails } = useMostRecentThumbnailsEnlarged({
    camera_mac_addresses: cameras.map((camera) => camera.camera.mac_address),
    enabled: true,
  });

  return (
    <TableRow>
      <TableCell colSpan={4}>
        <Stack direction="row" spacing={1}>
          {cameras.map((camera) => (
            <Box
              key={camera.camera.mac_address}
              width="25%"
              sx={{ aspectRatio: "16/9" }}
            >
              <VideoPlayer
                videoName={camera.camera.name}
                kinesisUrlSource={{
                  camera: camera.camera,
                  kinesisOptions: {
                    requestType: "live",
                    mac_address: camera.camera.mac_address,
                    resolution_config: LOW_RESOLUTION_CONFIG,
                    log_live_activity: false,
                    prefer_webrtc: true,
                  },
                }}
                playerOptions={VIDEO_PLAYER_OPTIONS}
                isAudioEnabled={camera.camera.is_audio_enabled}
                posterUrl={
                  mostRecentThumbnails?.get(camera.camera.mac_address)
                    ?.s3_signed_url
                }
                allowPanZoom={false}
                onResponseFetched={addLiveStreamResponse}
                onKinesisUrlSourceRemove={removeLiveStreamResponse}
              />
            </Box>
          ))}
        </Stack>
      </TableCell>
    </TableRow>
  );
}
