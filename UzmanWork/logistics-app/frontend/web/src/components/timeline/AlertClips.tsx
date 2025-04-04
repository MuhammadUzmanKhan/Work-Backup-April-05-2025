import { useEffect, useState } from "react";
import { TimelineClipGridMemoized } from "./TimelineClipGrid";
import {
  CameraResponse,
  DetectionObjectTypeCategory,
  UserAlert,
} from "coram-common-utils";
import { DateTime } from "luxon";
import { DetectionAggregatedInterval } from "utils/detection_aggregation";
import { augmentClipsWithThumbnails } from "utils/thumbnails";

export interface AlertClipsProps {
  alerts: UserAlert[];
  currentStream: CameraResponse;
  timezone: string;
}

export function AlertClips({
  alerts,
  currentStream,
  timezone,
}: AlertClipsProps) {
  const [detections, setDetections] = useState<DetectionAggregatedInterval[]>(
    []
  );

  // Preprocess the clips to chunk them based on time.
  useEffect(() => {
    async function createIntervals() {
      const detections = alerts.map((alert) => {
        const startTime = DateTime.fromISO(alert.start_time).setZone(timezone);
        const endTime = startTime.plus({ minutes: 5 });

        const detection: DetectionAggregatedInterval = {
          startTime: startTime.minus({ seconds: 5 }),
          endTime: endTime,
          detectionType: DetectionObjectTypeCategory.UNKNOWN,
          camera: currentStream,
        };

        return detection;
      });

      setDetections(await augmentClipsWithThumbnails(detections));
    }
    createIntervals();
  }, [alerts, timezone, currentStream]);

  return <TimelineClipGridMemoized clips={detections} clipFilter={undefined} />;
}
