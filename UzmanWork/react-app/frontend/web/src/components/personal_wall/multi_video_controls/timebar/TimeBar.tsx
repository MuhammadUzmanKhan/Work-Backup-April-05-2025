import { Box, Tooltip } from "@mui/material";
import type { SxProps } from "@mui/material";
import { PanZoomContainer } from "components/zoom_free_timeline/PanZoomContainer";
import { TimeAxis } from "components/zoom_free_timeline/TimeAxis";
import {
  DEFAULT_VISIBLE_PORTION,
  centerPanzoomOnTime,
  computeRatio,
  getVisiblePortionFromPanzoom,
  isShortClick,
  rectRatio,
  scaleDetailFromScale,
  timeFromRatio,
} from "components/zoom_free_timeline/utils";
import { TimeInterval } from "utils/time";
import { useElementSize } from "hooks/element_size";
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  MouseEvent as MouseEventReact,
  useState,
  forwardRef,
  useImperativeHandle,
  Ref,
  useContext,
} from "react";
import { ProgressBar } from "./ProgressBar";
import type { PanzoomEventDetail, PanzoomObject } from "@panzoom/panzoom";
import Panzoom from "@panzoom/panzoom";
import { Transform } from "panzoom";
import { MULTI_VIDEO_TIMEBAR_SCALE_DETAILS } from "./utils";
import { TRIAGE_ICON_WIDTH, TriageController } from "./TriageController";
import { DateTime } from "luxon";
import { Layer, Stage } from "react-konva";
import { KonvaContainer } from "components/zoom_free_timeline/KonvaContainer";
import { RectangularClipIndicator } from "components/RectangularClipIndicator";
import { TriageDragContext } from "contexts/triage_drag_context";

const FOREGROUND_TIME_NOW_COLOR = "#B1AEFF";
const FOREGROUND_TIME_SYNC_COLOR = "#6163FF";
const AXIS_HEIGHT = 40;
const TIME_BAR_HEIGHT = 15;
export const PANZOOM_INITIAL_ZOOM = 40;
export const PANZOOM_MAX_ZOOM = 300;
export const PANZOOM_MIN_ZOOM = 1;
const PANZOOM_STEP = 0.2;

interface TimeBarProps {
  currentTime: DateTime;
  liveTime: DateTime;
  barTimeInterval: TimeInterval;
  onClick: (time: DateTime) => void;
  zoom: number;
  setZoom: Dispatch<SetStateAction<number>>;
  sx?: SxProps;
  timeBarHeight?: number;
  clipTimeInterval: TimeInterval;
  isLive: boolean;
  onStartScrubbing?: VoidFunction;
  onStopScrubbing?: VoidFunction;
}

// Interface for the imperative methods of the timeBar
export interface TimeBarHandle {
  // center the panzoom on the given time
  centerPanzoomOnTime(time: DateTime): void;
}

export const TimeBar = forwardRef(function TimeBar(
  {
    currentTime,
    liveTime,
    barTimeInterval,
    onClick,
    zoom,
    setZoom,
    sx,
    timeBarHeight = TIME_BAR_HEIGHT,
    clipTimeInterval,
    isLive,
    onStartScrubbing,
    onStopScrubbing,
  }: TimeBarProps,
  ref: Ref<TimeBarHandle>
) {
  // Transform matrix of the panzoom object
  const [panzoomTransform, setPanzoomTransform] = useState<Transform>({
    scale: 1.0,
    x: 0.0,
    y: 0.0,
  });
  // Hover time
  const [hoverTime, setHoverTime] = useState<DateTime>(currentTime);

  // update the triage dragging status
  const { triageDragStatus, setTriageDragStatus } =
    useContext(TriageDragContext);

  const { size, setRef } = useElementSize();
  const pointerDownTime = useRef<number>(0);
  const panzoomElementRef = useRef<HTMLElement>(null);
  const panzoomInstanceRef = useRef<PanzoomObject | null>(null);
  const konvaParentElementRef = useRef<HTMLElement>(null);
  const timeRef = useRef<DateTime>(currentTime);
  timeRef.current = currentTime;

  // Setup panzoom object and events
  useEffect(() => {
    if (!panzoomElementRef.current || !konvaParentElementRef.current) return;
    const panzoomNode = panzoomElementRef.current;
    const nodeKonvaParent = konvaParentElementRef.current;

    function onPanzoomChange(ev: unknown) {
      const { scale, x, y } = (ev as CustomEvent<PanzoomEventDetail>).detail;
      setPanzoomTransform({ scale, x, y });
      setTriageDragStatus((prev) => ({
        ...prev,
        visiblePortion: getVisiblePortionFromPanzoom(
          panzoomNode,
          nodeKonvaParent
        ),
        timeInterval: barTimeInterval,
      }));
    }

    function onPointerDown(ev: PointerEvent) {
      pointerDownTime.current = ev.timeStamp;
      panzoomInstance.handleDown(ev);
    }

    function onWheel(ev: WheelEvent) {
      ev.preventDefault();
      // This is true when we are scrolling horizontally
      if (Math.abs(ev.deltaX) >= Math.abs(ev.deltaY)) {
        return;
      }
      panzoomInstance.zoomWithWheel(ev);
      setZoom(panzoomInstance.getScale());
    }

    const panzoomInstance = Panzoom(panzoomNode, {
      // Disable events as we add our own
      // Defaults events don't bubble up, so we can't intercept them
      noBind: true,
      // Allow children to handle events
      // Otherwise, we can't use pointer events on children
      handleStartEvent: () => {
        return;
      },
      minScale: PANZOOM_MIN_ZOOM,
      maxScale: PANZOOM_MAX_ZOOM,
      // We don't want to pan on the y axis as we invert the scaling
      disableYAxis: true,
      panOnlyWhenZoomed: true,
      // Clip the chart to the parent, so we don't get events outside of the chart
      contain: "outside",
      step: PANZOOM_STEP,
      cursor: "default",
    });
    panzoomInstanceRef.current = panzoomInstance;

    panzoomNode.addEventListener("panzoomchange", onPanzoomChange);
    nodeKonvaParent.addEventListener("pointerdown", onPointerDown);
    nodeKonvaParent.addEventListener("pointermove", panzoomInstance.handleMove);
    document.addEventListener("pointerup", panzoomInstance.handleUp);
    nodeKonvaParent.addEventListener("wheel", onWheel, {
      passive: false,
    });

    // Center the panzoom on the current time (either live or current time)
    // NOTE(@lberg): this is performed only once on mount
    // TODO(@lberg): actually also when time range changes
    centerPanzoomOnTime(
      timeRef.current,
      barTimeInterval,
      panzoomNode.clientWidth,
      panzoomInstance,
      undefined,
      (panzoomInstance) => setZoom(panzoomInstance.getScale())
    );

    return () => {
      panzoomNode.removeEventListener("panzoomchange", onPanzoomChange);
      nodeKonvaParent.removeEventListener("pointerdown", onPointerDown);
      nodeKonvaParent.removeEventListener(
        "pointermove",
        panzoomInstance.handleMove
      );
      document.removeEventListener("pointerup", panzoomInstance.handleUp);
      nodeKonvaParent.removeEventListener("wheel", onWheel);
      panzoomInstance.destroy();
      panzoomInstanceRef.current = null;
    };
  }, [barTimeInterval, setPanzoomTransform, setZoom, setTriageDragStatus]);

  // Setup imperative methods
  useImperativeHandle(
    ref,
    () => {
      return {
        centerPanzoomOnTime(time: DateTime) {
          const panzoomInstance = panzoomInstanceRef.current;
          if (panzoomInstance) {
            centerPanzoomOnTime(
              time,
              barTimeInterval,
              size.width,
              panzoomInstance,
              PANZOOM_INITIAL_ZOOM,
              (panzoomInstance) => setZoom(panzoomInstance.getScale())
            );
          }
        },
      };
    },
    [size, barTimeInterval, setZoom]
  );

  //  Apply zoom to the panzoom object
  useEffect(() => {
    const panzoomInstance = panzoomInstanceRef.current;
    if (!panzoomInstance) return;
    panzoomInstance.zoom(zoom);
  }, [zoom]);

  // Handle click and trigger user callback
  function onClickCb(ev: MouseEventReact) {
    if (
      !panzoomElementRef.current ||
      !isShortClick(pointerDownTime.current, ev.timeStamp)
    )
      return;
    const ratioInChart = rectRatio(panzoomElementRef.current, ev.pageX);
    const clickTime = timeFromRatio(ratioInChart, barTimeInterval);
    // Don't trigger callback if we click in the future
    if (clickTime > DateTime.now()) {
      return;
    }
    onClick(clickTime);
  }

  function onTriageMouseDown() {
    setTriageDragStatus({
      ...triageDragStatus,
      isDragging: true,
      time: currentTime,
      timeInterval: barTimeInterval,
    });
    onStartScrubbing?.();
  }

  function onTriageMouseUp(event: MouseEventReact) {
    if (!panzoomElementRef.current || !triageDragStatus.isDragging) return;
    const ratioInTimeInterval = rectRatio(
      panzoomElementRef.current,
      event.pageX
    );
    const time = timeFromRatio(ratioInTimeInterval, barTimeInterval);
    setTriageDragStatus({ ...triageDragStatus, isDragging: false });
    if (time < DateTime.now()) {
      onClick(time);
    }
    onStopScrubbing?.();
  }

  function onTriageMouseMove(event: MouseEventReact) {
    if (
      !triageDragStatus.isDragging ||
      !konvaParentElementRef.current ||
      !panzoomElementRef.current
    )
      return;
    const ratioInTimeInterval = rectRatio(
      panzoomElementRef.current,
      event.pageX
    );
    // Don't allow to drag in the future
    const time = timeFromRatio(ratioInTimeInterval, barTimeInterval);
    if (time > DateTime.now()) {
      return;
    }
    setTriageDragStatus({
      ...triageDragStatus,
      time,
    });
  }

  function onTimeBarMouseMove(event: MouseEventReact) {
    if (panzoomElementRef.current) {
      setHoverTime(
        timeFromRatio(
          rectRatio(panzoomElementRef.current, event.pageX),
          barTimeInterval
        )
      );
    }
  }

  // TODO(@lberg): Utils functions would improve readability a lot here

  // The visible portion of the whole chart
  const visiblePortion =
    !panzoomElementRef.current || !konvaParentElementRef.current
      ? DEFAULT_VISIBLE_PORTION
      : getVisiblePortionFromPanzoom(
          panzoomElementRef.current,
          konvaParentElementRef.current
        );

  const progressBarValues = [
    {
      value: computeRatio(
        liveTime.diff(barTimeInterval.timeStart).as("seconds") /
          barTimeInterval.timeEnd.diff(barTimeInterval.timeStart).as("seconds"),
        visiblePortion,
        true
      ),
      color: FOREGROUND_TIME_NOW_COLOR,
    },
    {
      value: computeRatio(
        currentTime.diff(barTimeInterval.timeStart).as("seconds") /
          barTimeInterval.timeEnd.diff(barTimeInterval.timeStart).as("seconds"),
        visiblePortion,
        true
      ),
      color: FOREGROUND_TIME_SYNC_COLOR,
    },
  ];

  const scaleDetail = scaleDetailFromScale(
    panzoomTransform.scale,
    MULTI_VIDEO_TIMEBAR_SCALE_DETAILS
  );

  const clipStartRatio = computeRatio(
    clipTimeInterval.timeStart.diff(barTimeInterval.timeStart).as("seconds") /
      barTimeInterval.timeEnd.diff(barTimeInterval.timeStart).as("seconds"),
    visiblePortion,
    true
  );

  const clipEndRatio = computeRatio(
    clipTimeInterval.timeEnd.diff(barTimeInterval.timeStart).as("seconds") /
      barTimeInterval.timeEnd.diff(barTimeInterval.timeStart).as("seconds"),
    visiblePortion,
    true
  );

  // The value of the triage as a ratio in the visible portion
  const triageValue = triageDragStatus.isDragging
    ? computeRatio(
        triageDragStatus.time.diff(barTimeInterval.timeStart).as("seconds") /
          barTimeInterval.timeEnd.diff(barTimeInterval.timeStart).as("seconds"),
        visiblePortion,
        true
      )
    : computeRatio(
        currentTime.diff(barTimeInterval.timeStart).as("seconds") /
          barTimeInterval.timeEnd.diff(barTimeInterval.timeStart).as("seconds"),
        visiblePortion,
        true
      );

  return (
    <Box ref={setRef} sx={sx}>
      {!isLive && (
        <KonvaContainer>
          <Stage width={size.width} height={size.height}>
            <Layer>
              <RectangularClipIndicator
                startX={clipStartRatio * size.width}
                endX={(clipEndRatio - clipStartRatio) * size.width}
                height={size.height}
              />
            </Layer>
          </Stage>
        </KonvaContainer>
      )}
      <Box position="relative" width="100%" height={TRIAGE_ICON_WIDTH}>
        <TriageController
          isDragging={triageDragStatus.isDragging}
          value={triageValue}
          tooltipText={triageDragStatus.time.toLocaleString(
            DateTime.DATETIME_FULL_WITH_SECONDS
          )}
          onMouseDown={onTriageMouseDown}
          onMouseMove={onTriageMouseMove}
          onMouseUp={onTriageMouseUp}
        />
      </Box>
      <Box ref={konvaParentElementRef} position="relative">
        <Tooltip
          title={`${hoverTime.toLocaleString(
            DateTime.DATETIME_FULL_WITH_SECONDS
          )}`}
          followCursor
          placement="bottom"
        >
          <Box height={timeBarHeight}>
            <ProgressBar
              values={progressBarValues}
              width={size.width}
              height={timeBarHeight}
              onClick={onClickCb}
              onMouseMove={onTimeBarMouseMove}
            />
          </Box>
        </Tooltip>
        <Box height={AXIS_HEIGHT}>
          <TimeAxis
            visiblePortion={visiblePortion}
            scaleDetailLevel={scaleDetail}
            timeInterval={barTimeInterval}
            heightPx={AXIS_HEIGHT}
            widthPx={size.width}
          />
        </Box>
        <PanZoomContainer ref={panzoomElementRef} />
      </Box>
    </Box>
  );
});
