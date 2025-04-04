import { Box, CircularProgress, Stack } from "@mui/material";
import {
  AccessTime as AccessTimeIcon,
  DateRange as DateRangeIcon,
} from "@mui/icons-material";

import {
  CameraResponse,
  DetectionObjectTypeCategory,
  VideoResRequestType,
  getPlayerCamera,
  getStaticResolutionConfig,
  getTimezoneFromCamera,
  isKinesisLiveRequest,
  KinesisVideoRequest,
  useStoreLiveStreamResponses,
  useKeepLiveVideosAlive,
  useFetchMostRecentThumbnailEnlarged,
} from "coram-common-utils";
import { TimelineControls } from "components/timeline/TimelineControls";
import { TimeLineIcons } from "components/timeline/TimeLineIcons";
import { LiveButton } from "components/video/LiveButton";
import { VideoPlayer, VideoPlayerHandle } from "components/video/VideoPlayer";
import { useAggregationRequest } from "hooks/timeline_page";
import { useCallback, useEffect, useRef, useState } from "react";
import { INITIAL_DRAWING_STATE } from "utils/drawing";
import { getVideoName, useCategoryAggregatedDetections } from "utils/globals";
import {
  CLIP_DURATION_MINUTES,
  PLAYER_OPTIONS_LIVE,
  PLAYER_OPTIONS_SCRUB_BAR,
  VideoPlayerOptions,
} from "utils/player_options";
import {
  TimeLineHandle,
  TimeLineZoomFree,
} from "components/zoom_free_timeline/TimeLine";
import { DateTime } from "luxon";
import { TimeInterval } from "utils/time";
import { formatDateTime } from "utils/dates";
import { useIsLimitedUser } from "components/layout/RoleGuards";

const LIVE_MODE_PLAYER_OPTIONS: VideoPlayerOptions = {
  htmlPlayerOptions: PLAYER_OPTIONS_LIVE,
  isLiveStream: true,
  hideTime: true,
  autoExitFullScreenOnPortrait: true,
};

const LIVE_RESOLUTION_CONFIG = getStaticResolutionConfig(
  VideoResRequestType.LOW
);

export function MobileTimelinePage({ camera }: { camera: CameraResponse }) {
  // Time of the video player
  const [videoTime, setVideoTime] = useState<DateTime>(
    DateTime.invalid("not initialized")
  );
  const playerRef = useRef<VideoPlayerHandle>(null);

  // End time to show detections
  const [timeControls, setTimeControls] = useState<TimeInterval>({
    timeEnd: DateTime.now().endOf("day"),
    timeStart: DateTime.now().startOf("day"),
  });

  // Aggregation request for the timeline
  const aggregationRequest = useAggregationRequest(
    INITIAL_DRAWING_STATE,
    timeControls
  );

  // Get the timezone from the stream (or default to PST)
  const timezone = getTimezoneFromCamera(camera);
  const isLimitedUser = useIsLimitedUser();
  // Query and cache detections
  // TODO(@yawei-ye): add check for timezone
  const detectionsQuery = useCategoryAggregatedDetections(
    camera,
    aggregationRequest,
    timezone,
    isLimitedUser
  );

  // Kinesis request params
  const [kinesisOption, setKinesisOptions] = useState<KinesisVideoRequest>({
    requestType: "live",
    mac_address: camera.camera.mac_address,
    resolution_config: getStaticResolutionConfig(VideoResRequestType.LOW),
    log_live_activity: true,
    prefer_webrtc: true,
  });

  // Player options
  const [playerOptions, setPlayerOptions] = useState<VideoPlayerOptions>(
    LIVE_MODE_PLAYER_OPTIONS
  );

  const { liveResponsesMap, addLiveStreamResponse, removeLiveStreamResponse } =
    useStoreLiveStreamResponses();

  useKeepLiveVideosAlive(liveResponsesMap, {
    enabled: playerOptions.isLiveStream,
  });

  // Ref to the timeline component
  const timeLineRef = useRef<TimeLineHandle>(null);

  const mostRecentThumbnailURL = useFetchMostRecentThumbnailEnlarged({
    cameraMacAddress: camera?.camera.mac_address || "",
  });

  // Update the time controls when the timezone changes
  useEffect(() => {
    setTimeControls({
      timeStart: DateTime.now().setZone(timezone).startOf("day"),
      timeEnd: DateTime.now().setZone(timezone).endOf("day"),
    });
  }, [timezone]);

  // Update kinesis and player options when we click on the timeline
  const onTimeLineClick = useCallback(
    (startTime: DateTime) => {
      // Set to replay with the given time span
      setKinesisOptions((kinesisOption) => ({
        requestType: "clip" as const,
        mac_address: kinesisOption.mac_address,
        start_time: formatDateTime(startTime),
        end_time: formatDateTime(
          startTime.plus({ minutes: CLIP_DURATION_MINUTES })
        ),
        resolution_config: kinesisOption.resolution_config,
      }));
      setPlayerOptions({
        htmlPlayerOptions: PLAYER_OPTIONS_SCRUB_BAR,
        isLiveStream: false,
        autoExitFullScreenOnPortrait: true,
      });
    },
    [setKinesisOptions, setPlayerOptions]
  );

  // Wrap the onTimeLineClick function and update the annotation too
  const onTimeLineClickWithAnnotation = useCallback(
    (startTime: DateTime) => {
      onTimeLineClick(startTime);
      timeLineRef.current?.setAnnotationFromTime(startTime);
      setTimeControls({
        timeStart: startTime.startOf("day"),
        timeEnd: startTime.endOf("day"),
      });
    },
    [onTimeLineClick]
  );

  // Update kinesis, player, time range and interaction when we go back to live
  function onLiveButtonClicked() {
    setKinesisOptions((kinesisOption) => ({
      requestType: "live" as const,
      mac_address: kinesisOption?.mac_address,
      resolution_config: LIVE_RESOLUTION_CONFIG,
      log_live_activity: false,
      prefer_webrtc: true,
    }));
    setPlayerOptions(LIVE_MODE_PLAYER_OPTIONS);
    setTimeControls((timeControls) => {
      return {
        ...timeControls,
        timeEnd: DateTime.now()
          .setZone(timeControls.timeStart.zone)
          .endOf("day"),
        timeStart: DateTime.now()
          .setZone(timeControls.timeStart.zone)
          .startOf("day"),
      };
    });
    timeLineRef.current?.resetAnnotation();
  }

  // Update the video time when we get the information from the player
  const onVideoTimeChange = useCallback(
    (time: DateTime) => {
      setVideoTime(time);
      // If we are not in live stream, update the sync time
      if (time.isValid && !playerOptions?.isLiveStream) {
        timeLineRef.current?.updateAnnotationFromTime(time);
      }
    },
    [setVideoTime, playerOptions]
  );

  // If we are still loading groups just show a progress
  if (!camera) {
    return <CircularProgress size="large" />;
  }

  return (
    <Stack
      sx={{
        minHeight: "calc(90vh - 64px)",
        justifyContent: "center",
        paddingX: 0.5,
      }}
    >
      <VideoPlayer
        ref={playerRef}
        videoName={
          camera.camera.name ?? getVideoName(camera.location, camera.group_name)
        }
        showBorder={false}
        kinesisUrlSource={{
          camera: getPlayerCamera(camera),
          kinesisOptions: kinesisOption,
        }}
        playerOptions={playerOptions}
        isAudioEnabled={camera.camera.is_audio_enabled}
        posterUrl={mostRecentThumbnailURL}
        onTimeChange={onVideoTimeChange}
        onResponseFetched={addLiveStreamResponse}
        onKinesisUrlSourceRemove={removeLiveStreamResponse}
      />
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        marginY={2}
      >
        <TimelineControls
          videoTime={videoTime}
          timezone={timezone}
          onTimeChange={(time) => onTimeLineClickWithAnnotation(time)}
          sx={{ ml: "1.5rem", width: "fit-content" }}
          preDateElement={
            <DateRangeIcon
              fontSize="small"
              sx={{ marginRight: "8px", color: "neutral.500" }}
            />
          }
          postDateElement={
            <AccessTimeIcon
              fontSize="small"
              sx={{ marginX: "8px", color: "neutral.500" }}
            />
          }
        />

        <LiveButton
          isLive={isKinesisLiveRequest(kinesisOption)}
          onClick={() => {
            onLiveButtonClicked();
          }}
        />
      </Stack>

      <Box display="flex" alignItems={"center"} gap={1}>
        <Box sx={{ marginTop: "-2.3rem" }}>
          <TimeLineIcons />
        </Box>
        <Box flexGrow={1} flexDirection={"column"} position="relative">
          <TimeLineZoomFree
            ref={timeLineRef}
            detections={detectionsQuery.data}
            day={timeControls.timeStart}
            timeLineConfig={{
              allowedTypes: [
                DetectionObjectTypeCategory.PERSON,
                DetectionObjectTypeCategory.VEHICLE,
                DetectionObjectTypeCategory.MOTION,
              ],
              seriesHeightPx: 25,
              isMobile: true,
              onTimeLineClick: onTimeLineClick,
            }}
            cameraMacAddress={camera.camera.mac_address}
          />
        </Box>
      </Box>
    </Stack>
  );
}
