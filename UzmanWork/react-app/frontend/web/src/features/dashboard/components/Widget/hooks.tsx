import { ClipData } from "components/timeline/ClipsGrid";
import {
  CameraResponse,
  ClipWidgetReportData,
  DashboardEventInterval,
  DetectionObjectTypeCategory,
  isDefined,
  useCamerasMap,
} from "coram-common-utils";
import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { augmentClipsWithThumbnails } from "utils/thumbnails";

// TODO (@slava) Refactor when we change ClipData
interface ClipWidgetData extends ClipData {
  detectionType: DetectionObjectTypeCategory;
  camera: CameraResponse;
}

export function useAugmentReportDataForClipWidget(
  reportData: ClipWidgetReportData
) {
  const [clipWidgetData, setClipWidgetData] = useState<ClipWidgetData[]>([]);

  const { isSuccess: isCamerasQuerySuccess, data: cameras } = useCamerasMap({
    refetchOnWindowFocus: false,
  });

  const [isAugmentingData, setIsAugmentingData] = useState(true);
  useEffect(() => {
    setIsAugmentingData(true);

    async function augmentData(data: DashboardEventInterval[]) {
      try {
        const clips = data
          .map((event) => ({
            event,
            camera: cameras.get(event.mac_address),
          }))
          .filter(
            (
              item
            ): item is {
              event: DashboardEventInterval;
              camera: CameraResponse;
            } => isDefined(item.camera)
          )
          .map(({ event, camera }) => ({
            startTime: DateTime.fromISO(event.start_time).setZone(
              camera.timezone
            ),
            endTime: DateTime.fromISO(event.end_time).setZone(camera.timezone),
            camera,
            detectionType: DetectionObjectTypeCategory.MOTION,
          }));
        const events = await augmentClipsWithThumbnails<ClipWidgetData>(clips);
        setClipWidgetData(events);
      } finally {
        setIsAugmentingData(false);
      }
    }

    augmentData(reportData.payload);
  }, [reportData, cameras]);

  const isLoading = !isCamerasQuerySuccess || isAugmentingData;

  return {
    isLoading,
    data: clipWidgetData,
  };
}
