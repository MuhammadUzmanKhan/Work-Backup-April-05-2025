import {
  AccessTime as AccessTimeIcon,
  Close as CloseIcon,
  DateRange as DateRangeIcon,
} from "@mui/icons-material";
import { Box, Stack, useTheme } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";

import {
  AnalyticsResponse,
  CameraResponse,
  DetectionObjectTypeCategory,
  ThumbnailService,
  UserAlert,
  VideoResRequestType,
  getDynamicResolutionConfig,
  getPlayerCamera,
  getStaticResolutionConfig,
  getTimezoneFromCamera,
  isDefined,
  isKinesisLiveRequest,
  isKinesisVideoClipRequest,
  useFetchMostRecentThumbnailEnlarged,
  useKeepLiveVideosAlive,
  useStoreLiveStreamResponses,
} from "coram-common-utils";
import { useLocation, useNavigate } from "react-router-dom";
import {
  clipTimeSyncDataState,
  getVideoName,
  shouldShowJourneyState,
  useCategoryAggregatedDetections,
} from "utils/globals";

import { TimelineControls } from "components/timeline/TimelineControls";
import {
  CLIP_DURATION_MINUTES,
  PLAYER_OPTIONS_LIVE,
  PLAYER_OPTIONS_SCRUB_BAR,
  VideoPlayerOptions,
} from "utils/player_options";

import { PolyDrawer } from "components/timeline/PolyDrawer";
import {
  CANVAS_Z_INDEX_FOREGROUND,
  CanvasDrawProps,
  VideoPlayer,
} from "components/video/VideoPlayer";
import { useCallback, useContext, useEffect, useRef, useState } from "react";

import Modal from "@mui/material/Modal";
import {
  LimitedUserRequired,
  useIsLimitedUser,
} from "components/layout/RoleGuards";
import { AlertClips } from "components/timeline/AlertClips";
import { AnalyticsDashboard } from "components/timeline/AnalyticsDashboard";
import { TimeLineIcons } from "components/timeline/TimeLineIcons";
import { TimelapseModalContent } from "components/timeline/TimelapseModalContent";
import { TimelineBar } from "components/timeline/TimelineBar";
import { TimelineClips } from "components/timeline/TimelineClips";
import {
  TimelineAlertState,
  TimelineUserAlertSettings,
} from "components/timeline/TimelineUserAlertSettings";
import { AnalyticsPanel } from "components/timeline/panels/AnalyticsPanel";
import { InfoPanel } from "components/timeline/panels/InfoPanel";
import { SearchPanel } from "components/timeline/panels/SearchPanel";
import {
  TimelapseData,
  TimelapseSelector,
} from "components/timeline/panels/TimelapsePanel";
import { LiveButton } from "components/video/LiveButton";
import {
  TimeLineHandle,
  TimeLineZoomFree,
} from "components/zoom_free_timeline/TimeLine";
import { NotificationContext } from "contexts/notification_context";
import { useAggregationRequest, useInitializeVideo } from "hooks/timeline_page";
import { DateTime } from "luxon";
import { useRecoilState } from "recoil";
import { selectorsEnum, useTimelineBarSelectors } from "reducers/timeline_bar";
import {
  DrawingMode,
  DrawingState,
  DrawingStateContext,
  INITIAL_DRAWING_STATE,
  isActivelyDrawing,
} from "utils/drawing";
import { JourneyStartPanel } from "components/timeline/journey/JourneyStartPanel";
import { convertToTrackThumbnailResponse } from "utils/journey_types";
import { parseMultiPlayerWasShown } from "components/timeline/utils";
import { useSearchParams } from "utils/search_params";
import { TimeInterval, clipSyncDataFromSearchParams } from "utils/time";
import { CreateArchiveDrawer } from "features/archive/components";
import { DownloadCreateDialog } from "components/DownloadCreateDialog";
import { ShareCreateDialog } from "components/ShareCreateDialog";
import { formatDateTime } from "utils/dates";

export type PlayerModalAction =
  | "showDownload"
  | "showShareVideo"
  | "showArchive";

// Height of the flex row containing the video player
const VIDEO_ROW_HEIGHT = "70vh";

const LIVE_MODE_PLAYER_OPTIONS: VideoPlayerOptions = {
  htmlPlayerOptions: PLAYER_OPTIONS_LIVE,
  isLiveStream: true,
  hideTime: true,
};
const LIVE_RESOLUTION_CONFIG = getStaticResolutionConfig(
  VideoResRequestType.HIGH
);

const CLIP_MODE_PLAYER_OPTIONS: VideoPlayerOptions = {
  htmlPlayerOptions: PLAYER_OPTIONS_SCRUB_BAR,
  isLiveStream: false,
};
const CLIP_RESOLUTION_CONFIG = getDynamicResolutionConfig(
  VideoResRequestType.HIGH
);

export function TimelinePage({ camera }: { camera: CameraResponse }) {
  const { setNotificationData } = useContext(NotificationContext);
  const navigate = useNavigate();

  const theme = useTheme();
  const { searchParams } = useSearchParams();
  const clipSyncDataFromURL = clipSyncDataFromSearchParams(searchParams);

  // Ref to the container of all bottom panels.
  // Used to scroll to the bottom for some panels.
  const panelContainerRef = useRef<HTMLDivElement>(null);
  const [shouldShowJourney, setShouldShowJourney] = useRecoilState(
    shouldShowJourneyState
  );

  const { timelineBarSelector, dispatch } = useTimelineBarSelectors();
  const [activeModal, setActiveModal] = useState<PlayerModalAction>();
  // Time of the video player
  const [videoTime, setVideoTime] = useState<DateTime>(() =>
    DateTime.now().setZone(getTimezoneFromCamera(camera))
  );

  const [drawingState, setDrawingState] = useState<DrawingState>(
    INITIAL_DRAWING_STATE
  );
  // Get the timezone from the stream (or default to PST)
  const timezone = getTimezoneFromCamera(camera);
  const [clipTimeInterval, setClipTimeInterval] = useState<TimeInterval | null>(
    null
  );

  const [timelapseData, setTimelapseData] = useState<TimelapseData>();

  // Whether we can store the clip sync data in the global state
  const canSetClipTimeSync = parseMultiPlayerWasShown(useLocation());
  // Global sync time shared across pages
  const [clipSyncData, setClipSyncData] = useRecoilState(clipTimeSyncDataState);

  // Initialize the video (potentially from the sync time)
  const {
    kinesisOption,
    playerOptions,
    timeControls,
    setKinesisOptions,
    setPlayerOptions,
    setTimeControls,
  } = useInitializeVideo(
    camera,
    LIVE_MODE_PLAYER_OPTIONS,
    LIVE_RESOLUTION_CONFIG,
    CLIP_MODE_PLAYER_OPTIONS,
    CLIP_RESOLUTION_CONFIG,
    isDefined(clipSyncDataFromURL) ? clipSyncDataFromURL : clipSyncData,
    (time: DateTime) => {
      timeLineRef.current?.setAnnotationFromTime(time);
      if (shouldShowJourney) {
        dispatch({
          type: selectorsEnum.showJourney,
          scrollToTop: false,
        });
        panelContainerRef.current?.scrollIntoView({ behavior: "smooth" });
        setShouldShowJourney(false);
      }
    }
  );

  const { liveResponsesMap, addLiveStreamResponse, removeLiveStreamResponse } =
    useStoreLiveStreamResponses();

  useKeepLiveVideosAlive(liveResponsesMap, {
    enabled: playerOptions.isLiveStream,
  });

  // Aggregation request for the timeline
  const aggregationRequest = useAggregationRequest(drawingState, timeControls);

  const isLimitedUser = useIsLimitedUser();
  // Query and cache detections
  // TODO(@yawei-ye): add check for timezone
  const detectionsQuery = useCategoryAggregatedDetections(
    camera,
    aggregationRequest,
    timezone,
    isLimitedUser
  );

  const [alertViewState, setAlertViewState] = useState<TimelineAlertState>(
    TimelineAlertState.LIST
  );

  const [detectedAlerts, setDetectedAlerts] = useState<UserAlert[]>([]);
  // Ref to the timeline component
  const timeLineRef = useRef<TimeLineHandle>(null);

  // Declare detection analytics state variable that contains the object analytics data
  const [analytics, setAnalytics] = useState<AnalyticsResponse>({
    detection_analytics: [],
    tracking_analytics: [],
  });

  // Set param to determine whether to show the analytics dashboard
  const [showAnalyticsDashboard, setShowAnalyticsDashboard] = useState(false);

  // If the user is not clicking on the analytics button, hide the analytics dashboard
  useEffect(() => {
    if (!timelineBarSelector.showAnalyticsControls) {
      setShowAnalyticsDashboard(false);
    }
  }, [timelineBarSelector.showAnalyticsControls]);

  // TODO(@lberg): this should be a reset function called when we click the selectors
  useEffect(() => {
    setDrawingState(INITIAL_DRAWING_STATE);
    setAlertViewState(TimelineAlertState.LIST);
    setDetectedAlerts([]);
  }, [timelineBarSelector]);

  useEffect(() => {
    // TODO: currently we don't have a  way to distinguish the following 2 state inside
    //       the PolyDrawer component:
    // drawing:        show closed icon
    // previewing: not show open icon
    // so we just hide the icon when the user is not possible to be in the drawing mode,
    // conditioned on the lastest closeIconPosition state change.
    if (
      timelineBarSelector.showAlert &&
      drawingState.closeIconPosition &&
      alertViewState !== TimelineAlertState.CREATE
    ) {
      setDrawingState((state) => ({
        ...state,
        closeIconPosition: undefined,
      }));
    }
  }, [
    alertViewState,
    timelineBarSelector.showAlert,
    drawingState.closeIconPosition,
  ]);

  // Get alignment, depending upon if timelineBar's icon's menu or popup opened or not.
  const gridAlignment =
    Object.values(timelineBarSelector).filter((selector) => selector).length > 0
      ? "end"
      : "center";

  // Update kinesis and player options when we click on the timeline
  const handleTimeline = useCallback(
    (startTime: DateTime) => {
      const clipTimeInterval = {
        timeStart: startTime,
        timeEnd: startTime.plus({ minutes: CLIP_DURATION_MINUTES }),
      };
      setClipTimeInterval(clipTimeInterval);
      setKinesisOptions((kinesisOptions) => ({
        requestType: "clip" as const,
        mac_address: kinesisOptions.mac_address,
        start_time: formatDateTime(clipTimeInterval.timeStart),
        end_time: formatDateTime(clipTimeInterval.timeEnd),
        resolution_config: CLIP_RESOLUTION_CONFIG,
      }));
      if (canSetClipTimeSync) {
        setClipSyncData({
          timeInterval: {
            timeStart: clipTimeInterval.timeStart,
            timeEnd: clipTimeInterval.timeEnd,
          },
          syncTime: clipTimeInterval.timeStart,
        });
      }
      setPlayerOptions(CLIP_MODE_PLAYER_OPTIONS);
    },
    [setKinesisOptions, setPlayerOptions, canSetClipTimeSync, setClipSyncData]
  );

  // Wrap the handleTimeline function and update the annotation too
  const processTimeLineClickWithAnnotation = useCallback(
    (startTime: DateTime) => {
      handleTimeline(startTime);
      timeLineRef.current?.setAnnotationFromTime(startTime);
      setTimeControls({
        timeStart: startTime.startOf("day"),
        timeEnd: startTime.endOf("day"),
      });
    },
    [handleTimeline, setTimeControls]
  );

  // Update kinesis, player, time range and interaction when we go back to live
  function onLiveButtonClicked() {
    setKinesisOptions((kinesisOption) => ({
      requestType: "live" as const,
      mac_address: kinesisOption.mac_address,
      resolution_config: LIVE_RESOLUTION_CONFIG,
      log_live_activity: false,
      prefer_webrtc: true,
    }));
    setPlayerOptions(LIVE_MODE_PLAYER_OPTIONS);
    setTimeControls((timeControls) => {
      return {
        ...timeControls,
        timeStart: DateTime.now().setZone(timezone).startOf("day"),
        timeEnd: DateTime.now().setZone(timezone).endOf("day"),
      };
    });
    if (canSetClipTimeSync) {
      setClipSyncData(null);
    }
    timeLineRef.current?.resetAnnotation();
    setClipTimeInterval(null);
  }

  const clearDrawings = useCallback(
    () =>
      setDrawingState((state) => ({
        ...state,
        rects: [],
        polygons: [],
        closeIconPosition: undefined,
      })),
    [setDrawingState]
  );

  // Add a callback when the "Show Timelapse" button is clicked
  async function onShowTimelapseClicked(
    startTime: DateTime,
    endTime: DateTime
  ) {
    try {
      const res = await ThumbnailService.timelapse({
        camera_mac_address: camera.camera.mac_address,
        start_time: formatDateTime(startTime),
        end_time: formatDateTime(endTime),
      });
      setTimelapseData({
        startTime: startTime,
        endTime: endTime,
        url: res,
      });
    } catch (e) {
      setNotificationData({
        message:
          "No valid timelapse video found! Please try a different time range!",
        severity: "error",
      });
    }
  }

  // Render the canvas if we are in drawing mode
  const canvasFn = useCallback(
    (props: CanvasDrawProps) => {
      if (drawingState.drawingMode === DrawingMode.FullImage) {
        return <></>;
      }
      return <PolyDrawer {...props} />;
    },
    [drawingState.drawingMode]
  );

  // Update the video time when we get the information from the player
  const onVideoTimeChange = useCallback(
    (time: DateTime) => {
      if (!time.isValid) {
        return;
      }
      setVideoTime(time);
      // If we are not in live stream, update the sync time
      if (!playerOptions.isLiveStream) {
        timeLineRef.current?.updateAnnotationFromTime(time);
        if (canSetClipTimeSync) {
          setClipSyncData((prev) =>
            prev ? { ...prev, syncTime: time } : null
          );
        }
      }
    },
    [
      setVideoTime,
      setClipSyncData,
      playerOptions.isLiveStream,
      canSetClipTimeSync,
    ]
  );

  const mostRecentThumbnailURL = useFetchMostRecentThumbnailEnlarged({
    cameraMacAddress: camera.camera.mac_address,
  });

  return (
    <DrawingStateContext.Provider value={{ drawingState, setDrawingState }}>
      <Stack
        sx={{
          backgroundColor: `${theme.palette.neutral?.["A100"]}`,
          marginRight: "3.75rem",
        }}
      >
        <Modal
          open={isDefined(timelapseData)}
          onClose={() => {
            setTimelapseData(undefined);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <Grid container spacing={2}>
            <Grid>
              {timelapseData && (
                <TimelapseModalContent
                  timelapseUrl={timelapseData.url}
                  timelapseParams={{
                    start_time: timelapseData.startTime,
                    end_time: timelapseData.endTime,
                    mac_address: camera.camera.mac_address,
                  }}
                />
              )}
            </Grid>
          </Grid>
        </Modal>
        <TimelineBar
          timelineBarSelectors={timelineBarSelector}
          onSearchIconClick={() => dispatch({ type: selectorsEnum.showSearch })}
          onTimelapseClick={() =>
            dispatch({ type: selectorsEnum.showTimelapse })
          }
          onInfoIconClick={() => dispatch({ type: selectorsEnum.showInfo })}
          onNewAlertIconClick={() =>
            dispatch({ type: selectorsEnum.showAlert })
          }
          onAnalyticsIconClick={() =>
            dispatch({ type: selectorsEnum.showAnalyticsControls })
          }
          onJourneyIconClick={() => {
            dispatch({
              type: selectorsEnum.showJourney,
              scrollToTop: false,
            });
            panelContainerRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
          isLiveStream={playerOptions.isLiveStream}
        />
        <Grid container justifyContent={gridAlignment} flex={1}>
          <Grid
            xs={8}
            display="flex"
            justifyContent="center"
            height={VIDEO_ROW_HEIGHT}
            position="relative"
          >
            <VideoPlayer
              videoName={
                camera.camera.name ||
                getVideoName(camera.location, camera.group_name)
              }
              showBorder={false}
              kinesisUrlSource={{
                camera: getPlayerCamera(camera),
                kinesisOptions: kinesisOption,
              }}
              playerOptions={playerOptions}
              isAudioEnabled={camera.camera.is_audio_enabled}
              posterUrl={mostRecentThumbnailURL}
              allowPanZoom={
                !timelineBarSelector.showAlert &&
                !timelineBarSelector.showAnalyticsControls &&
                !timelineBarSelector.showSearch
              }
              canvasDraw={canvasFn}
              onTimeChange={onVideoTimeChange}
              onDownloadIconClick={async () => setActiveModal("showDownload")}
              onShareVideoIconClick={() => setActiveModal("showShareVideo")}
              onArchiveIconClick={() => setActiveModal("showArchive")}
              isDrawingEnabled={isActivelyDrawing(drawingState)}
              onHDIconClick={(resolution) =>
                setKinesisOptions((kinesisOption) => ({
                  ...kinesisOption,
                  resolution_config: getStaticResolutionConfig(resolution),
                }))
              }
              onResponseFetched={addLiveStreamResponse}
              onKinesisUrlSourceRemove={removeLiveStreamResponse}
            />
            {drawingState.closeIconPosition && (
              <CloseIcon
                sx={{
                  zIndex: CANVAS_Z_INDEX_FOREGROUND,
                  position: "absolute",
                  top: drawingState.closeIconPosition.top - 22,
                  left: drawingState.closeIconPosition.right,
                  cursor: "pointer",
                  color: "common.white",
                  borderRadius: "2rem",
                  p: "4px",
                  backgroundColor: "secondary.main",
                }}
                onClick={() => {
                  clearDrawings();
                }}
              />
            )}
          </Grid>
          {timelineBarSelector.showSearch && (
            <Grid xs={2}>
              <SearchPanel
                clearDrawings={clearDrawings}
                isFetching={detectionsQuery.isFetching}
                onCloseClick={() => dispatch({ type: selectorsEnum.default })}
                containerProps={{
                  height: VIDEO_ROW_HEIGHT,
                }}
              />
            </Grid>
          )}
          {timelineBarSelector.showTimelapse && (
            <Grid xs={2}>
              <TimelapseSelector
                timezone={timezone}
                onCloseClick={() => dispatch({ type: selectorsEnum.default })}
                onShowTimelapseClicked={onShowTimelapseClicked}
                containerProps={{
                  height: VIDEO_ROW_HEIGHT,
                }}
              />
            </Grid>
          )}
          {timelineBarSelector.showInfo && (
            <Grid xs={2}>
              <InfoPanel
                onCloseClick={() => dispatch({ type: selectorsEnum.default })}
                currentStream={camera}
                containerProps={{
                  height: VIDEO_ROW_HEIGHT,
                }}
              />
            </Grid>
          )}
          {timelineBarSelector.showAlert && (
            <Grid xs={2} sx={{ overflowY: "scroll", bgcolor: "white" }}>
              <TimelineUserAlertSettings
                timelineAlertState={alertViewState}
                setTimelineAlertState={setAlertViewState}
                cameraMacAddress={camera?.camera.mac_address}
                timezone={timezone}
                onCloseClick={() => dispatch({ type: selectorsEnum.default })}
                setDetectedAlerts={setDetectedAlerts}
                containerProps={{
                  height: VIDEO_ROW_HEIGHT,
                }}
              />
            </Grid>
          )}
          {timelineBarSelector.showAnalyticsControls && (
            <Grid xs={2}>
              <AnalyticsPanel
                cameraMacAddress={camera.camera.mac_address}
                timezone={timezone}
                showAnalyticsDashboard={showAnalyticsDashboard}
                setAnalytics={setAnalytics}
                setShowAnalyticsDashboard={setShowAnalyticsDashboard}
                onCloseClick={() => dispatch({ type: selectorsEnum.default })}
                drawingState={drawingState}
                containerProps={{
                  height: VIDEO_ROW_HEIGHT,
                }}
              />
            </Grid>
          )}
          {timelineBarSelector.showJourney && (
            <Grid xs={2}>
              <></>
            </Grid>
          )}
        </Grid>
        <LimitedUserRequired>
          <Stack
            sx={{
              backgroundColor: "#fff",
              padding: "0.2rem 0.5rem",
              position: "relative",
              height: "170px",
            }}
          >
            <Grid
              container
              marginTop={"auto"}
              alignItems="center"
              spacing={2}
              zIndex={100}
              xs={8}
              mb={0.5}
            >
              <Grid xs={6}>
                <TimelineControls
                  videoTime={videoTime}
                  timezone={timezone}
                  onTimeChange={(time) =>
                    processTimeLineClickWithAnnotation(time)
                  }
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
              </Grid>
              <Grid xs={6}>
                <Stack
                  direction="row"
                  alignItems="center"
                  gap={1}
                  justifyContent="center"
                  margin={"auto"}
                  maxWidth="300px"
                >
                  <LiveButton
                    isLive={isKinesisLiveRequest(kinesisOption)}
                    onClick={() => {
                      onLiveButtonClicked();
                    }}
                  />
                </Stack>
              </Grid>
            </Grid>
            <Box display="flex" alignItems={"center"} gap={1}>
              <Box sx={{ marginTop: "-1.0rem" }}>
                <TimeLineIcons />
              </Box>
              <Box
                flexGrow={1}
                maxWidth={"calc(100% - 2rem)"}
                flexDirection={"column"}
                position="relative"
              >
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
                    onTimeLineClick: handleTimeline,
                  }}
                  cameraMacAddress={camera.camera.mac_address}
                />
              </Box>
            </Box>
          </Stack>
          <Box ref={panelContainerRef}>
            {!timelineBarSelector.showAlert &&
              !timelineBarSelector.showAnalyticsControls &&
              !timelineBarSelector.showJourney && (
                <TimelineClips
                  detections={detectionsQuery.data}
                  currentStream={camera}
                  timeInterval={timeControls}
                  drawingState={drawingState}
                  videoTime={videoTime}
                />
              )}
            {timelineBarSelector.showAlert && (
              <AlertClips
                alerts={detectedAlerts}
                currentStream={camera}
                timezone={timezone}
              />
            )}
            {showAnalyticsDashboard && (
              <AnalyticsDashboard
                analytics={analytics}
                timezone={timezone}
                onTimeChange={processTimeLineClickWithAnnotation}
              />
            )}
            {timelineBarSelector.showJourney &&
              isKinesisVideoClipRequest(kinesisOption) && (
                <JourneyStartPanel
                  macAddress={camera.camera.mac_address}
                  startTime={DateTime.fromISO(kinesisOption.start_time).setZone(
                    timezone
                  )}
                  endTime={DateTime.fromISO(kinesisOption.end_time).setZone(
                    timezone
                  )}
                  onTrackClick={(track) => {
                    setShouldShowJourney(true);
                    const timeStart = DateTime.fromISO(
                      kinesisOption.start_time
                    );
                    setClipSyncData({
                      timeInterval: {
                        timeStart: timeStart,
                        timeEnd: DateTime.fromISO(kinesisOption.end_time),
                      },
                      // If the video has not started playing, videoTime might be invalid
                      syncTime: videoTime.isValid ? videoTime : timeStart,
                    });
                    // Set a state for the journey page
                    navigate("/timeline/journey", {
                      state: {
                        track: convertToTrackThumbnailResponse(track),
                        timezone: timezone,
                        cameraName: camera.camera.name,
                      },
                    });
                  }}
                />
              )}
          </Box>
        </LimitedUserRequired>
      </Stack>
      <DownloadCreateDialog
        open={activeModal === "showDownload"}
        clipTimeInterval={clipTimeInterval}
        onCloseClick={() => setActiveModal(undefined)}
        currentStream={camera}
      />
      <CreateArchiveDrawer
        open={activeModal === "showArchive"}
        onClose={() => setActiveModal(undefined)}
        clipTimeInterval={clipTimeInterval}
        cameraResponse={camera}
      />
      <ShareCreateDialog
        open={activeModal === "showShareVideo"}
        clipTimeInterval={clipTimeInterval}
        onCloseClick={() => setActiveModal(undefined)}
        currentStream={camera}
      />
    </DrawingStateContext.Provider>
  );
}
