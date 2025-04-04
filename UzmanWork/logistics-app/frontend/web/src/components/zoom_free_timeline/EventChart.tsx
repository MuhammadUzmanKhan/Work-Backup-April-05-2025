import {
  DetectionObjectTypeCategory,
  DEFAULT_TIMEZONE,
} from "coram-common-utils";
import { ScaleDetailLevel, VisiblePortion } from "./utils";
import { TimeInterval } from "utils/time";
import { useState } from "react";
import { Stage, Layer, Rect, Group, Line } from "react-konva";
import { DetectionAggregatedInterval } from "utils/detection_aggregation";
import { AnnotationMark, Annotation } from "./AnnotationMark";
import { CurrentTimeMark } from "./CurrentTimeMark";
import { EventsSeries } from "./EventsSeries";
import { KonvaContainer } from "./KonvaContainer";
import { ScrubTimeMark } from "./ScrubTimeMark";
import { Tooltip, Typography } from "@mui/material";
import { DateTime } from "luxon";

interface EventChartProps {
  day: DateTime;
  detections: DetectionAggregatedInterval[];
  allowedTypes: DetectionObjectTypeCategory[];
  annotation: Annotation;
  visiblePortion: VisiblePortion;
  scaleDetailLevel: ScaleDetailLevel;
  width: number;
  seriesHeight: number;
  pointerOffset?: number;
  onClick: (pageX: number, timeStamp: number) => void;
}

export function EventChart({
  day,
  detections,
  allowedTypes,
  annotation,
  visiblePortion,
  scaleDetailLevel,
  width,
  seriesHeight,
  pointerOffset,
  onClick,
}: EventChartProps) {
  const chartHeight = seriesHeight * allowedTypes.length;
  const [hoverTimeInterval, setHoverTimeInterval] = useState<TimeInterval>();

  const [containerStyle] = useState<React.CSSProperties>({
    height: chartHeight,
    width: "100%",
    position: "relative",
  });

  const timezone = day.zoneName || DEFAULT_TIMEZONE;

  return (
    <Tooltip
      title={
        hoverTimeInterval && (
          <Typography variant="body2">
            {hoverTimeInterval.timeStart
              .setZone(timezone)
              .toLocaleString(DateTime.TIME_WITH_SECONDS)}
            --
            {hoverTimeInterval.timeEnd
              .setZone(timezone)
              .toLocaleString(DateTime.TIME_WITH_SECONDS)}
          </Typography>
        )
      }
      followCursor
      placement="top"
      open={hoverTimeInterval !== undefined}
    >
      <KonvaContainer sx={containerStyle}>
        <Stage
          width={width}
          height={chartHeight}
          onClick={(ev) => onClick(ev.evt.pageX, ev.evt.timeStamp)}
          onTap={(ev) => {
            const evTouch = ev.evt as TouchEvent;
            if (evTouch.changedTouches.length > 0)
              onClick(evTouch.changedTouches[0].pageX, ev.evt.timeStamp);
          }}
        >
          <Layer>
            <Rect
              x={0}
              y={0}
              width={width}
              height={chartHeight}
              stroke="lightgray"
              strokeWidth={1}
            />
            {allowedTypes.map((type, index) => (
              <Group key={type} onWheel={() => setHoverTimeInterval(undefined)}>
                <EventsSeries
                  detectionType={type}
                  startDay={day}
                  width={width}
                  height={seriesHeight}
                  offsetY={index * seriesHeight}
                  detections={detections}
                  visiblePortion={visiblePortion}
                  scaleDetailLevel={scaleDetailLevel}
                  onEventMouseEnter={(info) =>
                    setHoverTimeInterval({
                      timeStart: info.startTime,
                      timeEnd: info.endTime,
                    })
                  }
                  onEventMouseLeave={() => setHoverTimeInterval(undefined)}
                />
                {index !== 0 && (
                  <Line
                    points={[
                      0,
                      index * seriesHeight,
                      width,
                      index * seriesHeight,
                    ]}
                    stroke="lightgray"
                    strokeWidth={1}
                  />
                )}
              </Group>
            ))}
            {day.hasSame(DateTime.now().setZone(day.zone), "day") && (
              <CurrentTimeMark
                visiblePortion={visiblePortion}
                timezone={timezone}
                height={chartHeight}
                containerWidth={width}
              />
            )}
            {annotation.visible && (
              <AnnotationMark
                visiblePortion={visiblePortion}
                annotation={annotation}
                width={width}
                height={chartHeight}
              />
            )}
            {pointerOffset !== undefined && (
              <ScrubTimeMark
                height={chartHeight}
                containerWidth={width}
                pointerOffset={pointerOffset}
                strokeWidth={1}
              />
            )}
          </Layer>
        </Stage>
      </KonvaContainer>
    </Tooltip>
  );
}
