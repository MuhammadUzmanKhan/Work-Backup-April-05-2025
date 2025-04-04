import { Paper, Stack } from "@mui/material";
import {
  PANZOOM_INITIAL_ZOOM,
  PANZOOM_MAX_ZOOM,
  PANZOOM_MIN_ZOOM,
  TimeBar,
  TimeBarHandle,
} from "./timebar/TimeBar";
import { forwardRef, useEffect, useRef, useState } from "react";
import { SYNC_FREQUENCY_MS } from "contexts/video_settings_context";
import { LeftControls } from "./LeftControls";
import { RightControls } from "./RightControls";
import { getTimeBarTimeControls } from "utils/multi_video_controls";
import { DateTime } from "luxon";
import { TimeInterval } from "utils/time";
import { preventEventBubbling } from "utils/dom_event_handling";

const ZOOM_BUTTONS_MULTIPLIER = 1.5;
const DEFAULT_WIDTH = "100%";

// NOTE(@lberg): These are required because of some bugs in the panzoom controller
// If the size of the panzoom changes and the zoom is not 1, the visible ratio changes
const LEFT_CONTROLS_WIDTH = 210;
const RIGHT_CONTROLS_WIDTH = 85;

interface MultiVideoControlsBarProps {
  isLive: boolean;
  isPlaying: boolean;
  playbackRate: number;
  syncTime: DateTime;
  timezone: string;
  onLiveClick: VoidFunction;
  onPlaybackRateControlClick: (speed: number) => void;
  onSeekControlClick: (seek: number) => void;
  onPlayClick: VoidFunction;
  onPauseClick: VoidFunction;
  onTimeBarClick: (time: DateTime) => void;
  width?: number | string;
  clipTimeInterval: TimeInterval;
  onStartScrubbing?: VoidFunction;
  onStopScrubbing?: VoidFunction;
}

export const MultiVideoControlsBar = forwardRef(function MultiVideoControlsBar(
  {
    isLive,
    isPlaying,
    playbackRate,
    syncTime,
    timezone,
    onLiveClick,
    onPlaybackRateControlClick,
    onSeekControlClick,
    onPlayClick,
    onPauseClick,
    onTimeBarClick,
    width = DEFAULT_WIDTH,
    clipTimeInterval,
    onStartScrubbing,
    onStopScrubbing,
  }: MultiVideoControlsBarProps,
  ref: React.Ref<HTMLDivElement>
) {
  // This is a live time updated every second, which is not related to the video
  const [liveTime, setLiveTime] = useState(DateTime.now().setZone(timezone));
  // This is the time range of the timebar
  const [barTimeInterval, setBarTimeInterval] = useState<TimeInterval>(
    getTimeBarTimeControls(isLive ? liveTime : syncTime)
  );

  const [zoom, setZoom] = useState(PANZOOM_INITIAL_ZOOM);
  // Reference to the timebar to control the panzoom
  const timebarRef = useRef<TimeBarHandle>(null);

  // Update the live time
  useEffect(() => {
    if (!isLive) {
      return;
    }
    const interval = setInterval(() => {
      setLiveTime(DateTime.now().setZone(timezone));
    }, SYNC_FREQUENCY_MS);

    return () => clearInterval(interval);
  }, [isLive, timezone]);

  // Invoked when the user manually change the time through controls
  function onTimeChange(time: DateTime) {
    onTimeBarClick(time);
    if (time < barTimeInterval.timeStart || time > barTimeInterval.timeEnd) {
      setBarTimeInterval(getTimeBarTimeControls(time));
    }
    timebarRef.current?.centerPanzoomOnTime(time);
  }

  function onLiveButtonClicked() {
    onLiveClick();
    if (liveTime > barTimeInterval.timeEnd) {
      setBarTimeInterval(getTimeBarTimeControls(liveTime));
    }
    timebarRef.current?.centerPanzoomOnTime(liveTime);
  }

  const videoTime = isLive ? liveTime : syncTime;

  return (
    <Paper elevation={24} sx={{ width: width }} ref={ref}>
      <Stack
        direction="row"
        alignItems="center"
        gap={2}
        py={1}
        px={2}
        onClick={preventEventBubbling}
      >
        <LeftControls
          videoTime={videoTime}
          timezone={timezone}
          isPlaying={isPlaying}
          isLive={isLive}
          playbackRate={playbackRate}
          onPlayClick={onPlayClick}
          onPauseClick={onPauseClick}
          onSeekControlClick={onSeekControlClick}
          onPlaybackRateControlClick={onPlaybackRateControlClick}
          onTimeChange={onTimeChange}
          width={LEFT_CONTROLS_WIDTH}
          mt="20px"
        />

        <TimeBar
          ref={timebarRef}
          liveTime={liveTime}
          currentTime={videoTime}
          sx={{
            flexGrow: 1,
          }}
          onClick={onTimeBarClick}
          barTimeInterval={barTimeInterval}
          zoom={zoom}
          setZoom={setZoom}
          clipTimeInterval={clipTimeInterval}
          isLive={isLive}
          onStartScrubbing={onStartScrubbing}
          onStopScrubbing={onStopScrubbing}
        />
        <RightControls
          isLive={isLive}
          onLiveClick={onLiveButtonClicked}
          onZoomInClick={() =>
            setZoom(Math.min(zoom * ZOOM_BUTTONS_MULTIPLIER, PANZOOM_MAX_ZOOM))
          }
          onZoomOutClick={() =>
            setZoom(Math.max(zoom / ZOOM_BUTTONS_MULTIPLIER, PANZOOM_MIN_ZOOM))
          }
          width={RIGHT_CONTROLS_WIDTH}
          mt="20px"
        />
      </Stack>
    </Paper>
  );
});
