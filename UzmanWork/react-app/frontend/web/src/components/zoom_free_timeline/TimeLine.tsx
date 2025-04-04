import { Box } from "@mui/material";
import type { PanzoomEventDetail } from "@panzoom/panzoom";
import Panzoom from "@panzoom/panzoom";
import { DetectionObjectTypeCategory } from "coram-common-utils";
import { useElementSize } from "hooks/element_size";
import { DateTime, Duration } from "luxon";
import { Transform } from "panzoom";
import React, {
  Dispatch,
  forwardRef,
  Ref,
  SetStateAction,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { DetectionAggregatedInterval } from "utils/detection_aggregation";
import { CLIP_DURATION_MINUTES } from "utils/player_options";
import { Annotation } from "./AnnotationMark";
import { EventChart } from "./EventChart";
import { PanZoomContainer } from "./PanZoomContainer";
import { ThumbnailTooltip, Tooltip } from "./ThumbnailTooltip";
import { TimeAxis } from "./TimeAxis";
import {
  centerPanzoomOnTime,
  dayRatioFromTime,
  DEFAULT_VISIBLE_PORTION,
  getVisiblePortionFromPanzoom,
  isShortClick,
  PANZOOM_MAX_ZOOM,
  PANZOOM_MIN_ZOOM,
  PANZOOM_MOBILE_ZOOM,
  rectRatio,
  scaleDetailFromScale,
  timeFromRatio,
} from "./utils";
import { DesktopOnly } from "components/layout/DesktopOnly";

const AXIS_HEIGHT = 30;

const EMPTY_ANNOTATION: Annotation = {
  visible: false,
  offsetStart: 0,
  offsetEnd: 0,
  offsetCurrent: 0,
};

interface TimeLineConfig {
  allowedTypes: DetectionObjectTypeCategory[];
  onTimeLineClick: (startTime: DateTime) => void;
  seriesHeightPx: number;
  isMobile?: boolean;
}

interface TimeLineProps {
  detections: DetectionAggregatedInterval[];
  timeLineConfig: TimeLineConfig;
  day: DateTime;
  cameraMacAddress: string;
}

interface TimeLineInternalProps extends TimeLineProps {
  annotation: Annotation;
  setAnnotation: Dispatch<SetStateAction<Annotation>>;
}

function TimeLineInternal({
  detections,
  timeLineConfig,
  day,
  cameraMacAddress,
  annotation,
  setAnnotation,
}: TimeLineInternalProps) {
  const { size, setRef } = useElementSize();
  const timeInterval = useMemo(
    () => ({
      timeStart: day.startOf("day"),
      timeEnd: day.endOf("day"),
    }),
    [day]
  );
  // These are only used in events, so they can stay references
  const pointerDownTime = useRef<number>(0);
  const panzoomRef = useRef<HTMLElement>(null);
  const konvaParentRef = useRef<HTMLElement>(null);

  // A tooltip is a small box that shows thumbnails on mouse hover
  const [tooltip, setTooltip] = React.useState<Tooltip>({
    visible: false,
    offsetStart: 0,
    tooltipTime: timeInterval.timeStart,
  });
  // The transform is the current state of the chart
  const [transform, setTransform] = React.useState<Transform>({
    scale: 1.0,
    x: 0.0,
    y: 0.0,
  });

  // Setup panzoom object and events
  React.useEffect(() => {
    if (!panzoomRef.current || !konvaParentRef.current) return;
    const panzoomNode = panzoomRef.current;
    const nodeKonvaParent = konvaParentRef.current;

    function onPanzoomChange(ev: unknown) {
      const { scale, x, y } = (ev as CustomEvent<PanzoomEventDetail>).detail;
      setTransform({ scale, x, y });
    }

    function onPointerDown(ev: PointerEvent) {
      pointerDownTime.current = ev.timeStamp;
      panzoomInstance.handleDown(ev);
    }

    // We use pointer events to get the mouse position and update the tooltip
    function onPointerMove(ev: PointerEvent) {
      const ratioInChart = rectRatio(panzoomNode, ev.clientX);
      const ratioInParent = rectRatio(nodeKonvaParent, ev.clientX);
      const newTooltipTime = timeFromRatio(ratioInChart, timeInterval);
      setTooltip((tooltip) => {
        // Don't update the tooltip if we are on mobile
        if (timeLineConfig.isMobile) {
          return {
            ...tooltip,
            visible: false,
          };
        }
        const showTooltip = newTooltipTime < DateTime.now();
        // We don't show the tooltip if it's in the future
        // We also don't update the position
        if (!showTooltip) {
          return {
            ...tooltip,
            visible: false,
          };
        }
        return {
          ...tooltip,
          visible: true,
          offsetStart: ratioInParent,
          tooltipTime: newTooltipTime,
        };
      });
      panzoomInstance.handleMove(ev);
    }

    // When we leave the chart, we hide the tooltip
    function onPointerLeave() {
      setTooltip((tooltip) => {
        return { ...tooltip, visible: false };
      });
    }

    function onWheel(ev: WheelEvent) {
      ev.preventDefault();
      // This is true when we are scrolling horizontally
      if (Math.abs(ev.deltaX) >= Math.abs(ev.deltaY)) {
        return;
      }
      panzoomInstance.zoomWithWheel(ev);
    }

    const panzoomInstance = Panzoom(panzoomNode, {
      // Disable events as we add our owns
      // Defaults events don't bubble up, so we can't intercept them
      noBind: true,
      // Allow children to handle events
      // Otherwise, we can't use pointer events on children
      handleStartEvent: () => {
        return;
      },
      minScale: timeLineConfig.isMobile
        ? PANZOOM_MOBILE_ZOOM
        : PANZOOM_MIN_ZOOM,
      maxScale: timeLineConfig.isMobile
        ? PANZOOM_MOBILE_ZOOM
        : PANZOOM_MAX_ZOOM,
      // We don't want to pan on the y axis as we invert the scaling
      disableYAxis: true,
      panOnlyWhenZoomed: true,
      // Clip the chart to the parent, so we don't get events outside of the chart
      contain: "outside",
      step: 0.4,
      cursor: "default",
    });

    panzoomNode.addEventListener("panzoomchange", onPanzoomChange);
    nodeKonvaParent.addEventListener("pointerdown", onPointerDown);
    nodeKonvaParent.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", panzoomInstance.handleUp);
    nodeKonvaParent.addEventListener("pointerleave", onPointerLeave);
    nodeKonvaParent.addEventListener("wheel", onWheel, {
      passive: false,
    });

    const timeNow = DateTime.now().setZone(timeInterval.timeStart.zone);
    // Center the chart on the current time on mobile
    if (
      timeLineConfig.isMobile &&
      timeNow.hasSame(timeInterval.timeStart, "day")
    ) {
      centerPanzoomOnTime(
        timeNow,
        timeInterval,
        panzoomNode.clientWidth,
        panzoomInstance
      );
    }

    return () => {
      panzoomInstance.destroy();
      panzoomNode.removeEventListener("panzoomchange", onPanzoomChange);
      nodeKonvaParent.removeEventListener("pointerdown", onPointerDown);
      nodeKonvaParent.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", panzoomInstance.handleUp);
      nodeKonvaParent.removeEventListener("pointerleave", onPointerLeave);
      nodeKonvaParent.removeEventListener("wheel", onWheel);
    };
  }, [timeInterval, setTooltip, setTransform, timeLineConfig.isMobile]);

  // Handle click on the chart to add an annotation and trigger user callback
  const onClickCb = (pageX: number, timeStamp: number) => {
    if (
      !panzoomRef.current ||
      !isShortClick(pointerDownTime.current, timeStamp)
    )
      return;
    const startRatioInChart = rectRatio(panzoomRef.current, pageX);
    const annotationTime = timeFromRatio(startRatioInChart, timeInterval);
    const endRatioInChart = dayRatioFromTime(
      annotationTime.plus(
        Duration.fromObject({ minutes: CLIP_DURATION_MINUTES })
      ),
      annotationTime.startOf("day")
    );
    // Don't add annotation if it's in the future
    if (annotationTime > DateTime.now()) {
      return;
    }
    setAnnotation({
      visible: true,
      offsetStart: startRatioInChart,
      offsetEnd: endRatioInChart,
      offsetCurrent: startRatioInChart,
    });
    timeLineConfig.onTimeLineClick(annotationTime);
  };

  // The scale detail level is the current level of detail of the chart.
  // It changes less often than the raw scale
  const scaleDetailLevel = scaleDetailFromScale(transform.scale);

  // The visible portion of the whole chart
  const visiblePortion =
    !panzoomRef.current || !konvaParentRef.current
      ? DEFAULT_VISIBLE_PORTION
      : getVisiblePortionFromPanzoom(
          panzoomRef.current,
          konvaParentRef.current
        );

  const chartHeight =
    timeLineConfig.seriesHeightPx * timeLineConfig.allowedTypes.length;
  return (
    <Box ref={setRef} sx={{ position: "relative" }}>
      {/* Chart */}
      <Box
        ref={konvaParentRef}
        sx={{
          height: chartHeight,
          width: "100%",
          position: "relative",
        }}
      >
        <EventChart
          day={timeInterval.timeStart}
          detections={detections}
          allowedTypes={timeLineConfig.allowedTypes}
          annotation={annotation}
          visiblePortion={visiblePortion}
          scaleDetailLevel={scaleDetailLevel}
          width={size.width}
          seriesHeight={timeLineConfig.seriesHeightPx}
          pointerOffset={tooltip.visible ? tooltip.offsetStart : undefined}
          onClick={onClickCb}
        />
        <PanZoomContainer ref={panzoomRef} />
      </Box>
      <DesktopOnly>
        <ThumbnailTooltip
          tooltip={tooltip}
          cameraMacAddress={cameraMacAddress}
          visiblePortion={visiblePortion}
          timeInterval={timeInterval}
        />
      </DesktopOnly>
      <TimeAxis
        visiblePortion={visiblePortion}
        scaleDetailLevel={scaleDetailLevel}
        timeInterval={timeInterval}
        heightPx={AXIS_HEIGHT}
        widthPx={size.width}
      />
    </Box>
  );
}

// Interface for the imperative methods of the timeline
export interface TimeLineHandle {
  resetAnnotation(): void;
  setAnnotationFromTime(time: DateTime): void;
  updateAnnotationFromTime(time: DateTime): void;
}

// This is a ref forwarding component that allows to add imperative methods to the timeline.
// see https://beta.reactjs.org/reference/react/useImperativeHandle
export const TimeLineZoomFree = forwardRef(function TimeLine(
  props: TimeLineProps,
  ref: Ref<TimeLineHandle>
) {
  // An annotation is a vertical line on the chart
  const [annotation, setAnnotation] =
    React.useState<Annotation>(EMPTY_ANNOTATION);

  useImperativeHandle(
    ref,
    () => {
      return {
        resetAnnotation() {
          setAnnotation(EMPTY_ANNOTATION);
        },
        setAnnotationFromTime(time: DateTime) {
          setAnnotation({
            visible: true,
            offsetStart: dayRatioFromTime(time, time.startOf("day")),
            offsetCurrent: dayRatioFromTime(time, time.startOf("day")),
            offsetEnd: dayRatioFromTime(
              time.plus(
                Duration.fromObject({ minutes: CLIP_DURATION_MINUTES })
              ),
              time.startOf("day")
            ),
          });
        },
        updateAnnotationFromTime(time: DateTime) {
          setAnnotation((prev) => ({
            ...prev,
            offsetCurrent: dayRatioFromTime(time, time.startOf("day")),
          }));
        },
      };
    },
    [setAnnotation]
  );

  return (
    <TimeLineInternal
      {...props}
      annotation={annotation}
      setAnnotation={setAnnotation}
    />
  );
});
