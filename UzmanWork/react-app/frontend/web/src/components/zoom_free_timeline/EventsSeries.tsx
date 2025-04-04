import { DetectionObjectTypeCategory } from "coram-common-utils";
import { DetectionAggregatedInterval } from "utils/detection_aggregation";
import { Group } from "react-konva";
import { DetectionAggregatedColors } from "theme/consts";
import {
  bumpItemSize,
  computeRatio,
  ScaleDetailLevel,
  VisiblePortion,
} from "./utils";
import { useEffect, useState } from "react";
import binarySearch from "binary-search";
import { EventRect } from "./EventRect";
import { DateTime } from "luxon";

const DETECTION_TYPE_MAP = new Map([
  [
    DetectionObjectTypeCategory.PERSON,
    {
      color: DetectionAggregatedColors.PERSON,
      label: DetectionObjectTypeCategory.PERSON,
    },
  ],
  [
    DetectionObjectTypeCategory.VEHICLE,
    {
      color: DetectionAggregatedColors.VEHICLE,
      label: DetectionObjectTypeCategory.VEHICLE,
    },
  ],
  [
    DetectionObjectTypeCategory.ANIMAL,
    {
      color: DetectionAggregatedColors.ANIMAL,
      label: DetectionObjectTypeCategory.ANIMAL,
    },
  ],
  [
    DetectionObjectTypeCategory.MOTION,
    {
      color: DetectionAggregatedColors.MOTION,
      label: DetectionObjectTypeCategory.MOTION,
    },
  ],
]);

interface ChartItemProps {
  originalDetection: DetectionAggregatedInterval;
  offsetStart: number;
  offsetEnd: number;
  color: string;
}

// TODO(@lberg): move to utils
function ratioBinarySearch(ratio: number, ratios: number[]) {
  const lessComparison = (a: number, b: number) => a - b;
  const idx = binarySearch(ratios, ratio, lessComparison);
  return idx < 0 ? -idx - 1 : idx;
}

interface SeriesItems {
  items: ChartItemProps[];
  itemsStarts: number[];
  itemsEnds: number[];
}

interface EventsSeriesProps {
  width: number;
  height: number;
  offsetY: number;
  detectionType: DetectionObjectTypeCategory;
  detections: DetectionAggregatedInterval[];
  visiblePortion: VisiblePortion;
  startDay: DateTime;
  scaleDetailLevel: ScaleDetailLevel;
  onEventMouseEnter?: (info: DetectionAggregatedInterval) => void;
  onEventMouseLeave?: (info: DetectionAggregatedInterval) => void;
}

export function EventsSeries({
  width,
  height,
  offsetY,
  detectionType,
  detections,
  visiblePortion,
  startDay,
  scaleDetailLevel,
  onEventMouseEnter,
  onEventMouseLeave,
}: EventsSeriesProps) {
  // Store the items to render in a state variable
  const [seriesItems, setSeriesItems] = useState<SeriesItems>({
    items: [],
    itemsStarts: [],
    itemsEnds: [],
  });

  // Compute the items to render when the detections change
  useEffect(() => {
    const secondsInDays = startDay.endOf("day").diff(startDay).as("seconds");
    const newChartItems = detections
      .filter((det) => det.detectionType === detectionType)
      .map((agg) => {
        return {
          originalDetection: agg,
          offsetStart:
            agg.startTime.diff(startDay).as("seconds") / secondsInDays,
          offsetEnd: agg.endTime.diff(startDay).as("seconds") / secondsInDays,
          color:
            DETECTION_TYPE_MAP.get(agg.detectionType)?.color ?? "lightgray",
        };
      });

    setSeriesItems({
      items: newChartItems,
      itemsStarts: newChartItems.map((item) => item.offsetStart),
      itemsEnds: newChartItems.map((item) => item.offsetEnd),
    });
  }, [detections, startDay, detectionType]);

  // Compute the index of the first and last item that is visible.
  // This is an optimization to avoid rendering all the items.
  const idxStart = ratioBinarySearch(
    visiblePortion.startRatio,
    seriesItems.itemsEnds
  );
  const idxEnd = ratioBinarySearch(
    visiblePortion.endRatio,
    seriesItems.itemsStarts
  );
  const eventsHeight = height * 0.6;
  const eventsOffsetY = (height - eventsHeight) / 2;
  return (
    <Group y={offsetY}>
      {seriesItems.items.slice(idxStart, idxEnd).map((item, idx) => {
        // Bump the item size at low zoom levels
        const { offsetStart, offsetEnd } = bumpItemSize(
          item.offsetStart,
          item.offsetEnd,
          scaleDetailLevel
        );
        return (
          <EventRect
            detection={item.originalDetection}
            key={idx}
            x={computeRatio(offsetStart, visiblePortion) * width}
            y={eventsOffsetY}
            width={
              computeRatio(
                visiblePortion.startRatio + offsetEnd - offsetStart,
                visiblePortion
              ) * width
            }
            height={eventsHeight}
            fill={item.color}
            onMouseEnter={onEventMouseEnter}
            onMouseLeave={onEventMouseLeave}
          />
        );
      })}
    </Group>
  );
}
