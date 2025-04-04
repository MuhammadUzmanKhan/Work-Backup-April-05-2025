import { PLAYER_OPTIONS_SCRUB_BAR } from "utils/player_options";
import {
  SharedVideoResponse,
  SharedVideosService,
  VideoResRequestType,
  isDefined,
  getStaticResolutionConfig,
  isKinesisSharedLiveStream,
  isKinesisSharedVideoClip,
} from "coram-common-utils";
import { Navigate } from "react-router-dom";
import { Box, CircularProgress, Stack } from "@mui/material";
import { DownloadButton } from "components/timeline/DownloadButton";
import { downloadNameFromData } from "components/timeline/utils";
import { useState } from "react";
import {
  useExchangeVideoHashForInfo,
  useKeepSharedLiveStreamAlive,
} from "hooks/public_video_page";
import { FixedSizeVideoPlayer } from "components/video/FixedSizeVideoPlayer";
import { useIsMobile } from "components/layout/MobileOnly";
import { StringParam, withValidatedPathParams } from "common/utils";
import { z } from "zod";

const RESOLUTION_CONFIG = getStaticResolutionConfig(VideoResRequestType.HIGH);

async function getUrlAndFileName(
  uniqueHash: string,
  sharedVideo: SharedVideoResponse
) {
  // TODO(lijiang): use the ClipData router to download the video given uniqueHash.
  // Download video with new way (S3)
  const url = await SharedVideosService.download(uniqueHash);
  const fileName = downloadNameFromData(
    sharedVideo.start_time,
    sharedVideo.end_time,
    sharedVideo.camera_location,
    sharedVideo.camera_name
  );
  return { url, fileName };
}

const PublicVideoPagePathParamsSchema = z.object({
  uniqueHash: StringParam,
});

type PublicVideoPagePathParams = z.infer<
  typeof PublicVideoPagePathParamsSchema
>;

interface PublicVideoPageProps {
  isLive: boolean;
}

function PublicVideoPageImpl({
  isLive,
  uniqueHash,
}: PublicVideoPageProps & PublicVideoPagePathParams) {
  // Whether the user can download the video
  const [canDownload, setCanDownload] = useState(false);
  const isMobile = useIsMobile();

  const {
    data: sharedData,
    isError,
    isFetching,
  } = useExchangeVideoHashForInfo(uniqueHash, isLive);

  useKeepSharedLiveStreamAlive(
    uniqueHash,
    RESOLUTION_CONFIG,
    isDefined(sharedData) &&
      isKinesisSharedLiveStream(sharedData) &&
      !sharedData.is_webrtc_enabled
  );

  if (isError) {
    return <Navigate to="/404" replace />;
  }

  // Show a spinner if we are still loading the video info
  if (isFetching || !isDefined(sharedData)) {
    return (
      <Box p={8} justifyContent="center" alignItems="center" display="flex">
        <CircularProgress size={64} />
      </Box>
    );
  }

  return (
    <Stack alignItems="center" gap={1}>
      <FixedSizeVideoPlayer
        kinesisUrlSource={{
          sharedData: sharedData,
          uniqueHash: uniqueHash,
          resolutionConfig: RESOLUTION_CONFIG,
          preferWebrtc: true,
        }}
        playerOptions={{
          htmlPlayerOptions: PLAYER_OPTIONS_SCRUB_BAR,
          isLiveStream: isLive,
          autoExitFullScreenOnPortrait: isMobile,
        }}
        onTimeChange={(time) => {
          if (time.isValid && !canDownload) {
            setCanDownload(true);
          }
        }}
        isAudioEnabled={sharedData.is_audio_enabled}
      />

      {isKinesisSharedVideoClip(sharedData) && (
        <DownloadButton
          disabled={!canDownload}
          urlAndFileNameCb={async () =>
            await getUrlAndFileName(uniqueHash, sharedData)
          }
          enabledTooltip={"Download shared video"}
          disabledTooltip={"Shared video not ready yet"}
          color="white"
        />
      )}
    </Stack>
  );
}

export const PublicVideoPage = withValidatedPathParams<
  PublicVideoPageProps,
  PublicVideoPagePathParams
>(PublicVideoPageImpl, PublicVideoPagePathParamsSchema);
