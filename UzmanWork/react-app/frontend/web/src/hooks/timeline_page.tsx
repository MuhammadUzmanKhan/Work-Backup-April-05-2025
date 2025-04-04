import {
  CameraResponse,
  CamerasService,
  DetectionAggregatedRequest,
  DynamicResolutionConfig,
  SearchAreaConvexPoly,
  SearchAreaRectangle,
  StaticResolutionConfig,
  isDefined,
  getTimezoneFromCamera,
  KinesisVideoRequest,
} from "coram-common-utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { DrawingMode, DrawingState } from "utils/drawing";
import { VideoPlayerOptions } from "utils/player_options";
import { ClipTimeSyncData, TimeInterval } from "utils/time";
import { DateTime, Duration } from "luxon";
import { formatDateTime } from "utils/dates";
import { useOnMount } from "./lifetime";
import { useQuery } from "react-query";

// Get the search polygons from the drawing state
export function getSearchPolyons(
  drawingState: DrawingState
): (SearchAreaRectangle | SearchAreaConvexPoly)[] {
  switch (drawingState.drawingMode) {
    case DrawingMode.Rectangle:
      return drawingState.rects
        .filter((rect) => rect.visible)
        .map((rect) => {
          return {
            coord_min: { x: rect.coord_min.x, y: rect.coord_min.y },
            coord_max: { x: rect.coord_max.x, y: rect.coord_max.y },
          };
        });
    case DrawingMode.Polygon:
      return drawingState.polygons.map((poly) => {
        return {
          coords: poly.map((point) => ({ x: point.x, y: point.y })),
        };
      });
    case DrawingMode.FullImage:
      return [];
    default: {
      const _exhaustiveCheck: never = drawingState.drawingMode;
      throw new Error(`Unhandled drawing mode: ${_exhaustiveCheck}`);
    }
  }
}

// Build an aggregation request for the backend
export function useAggregationRequest(
  drawingState: DrawingState,
  timeControls: TimeInterval
): DetectionAggregatedRequest {
  const aggregationRequest = useMemo(() => {
    return {
      start_time: formatDateTime(timeControls.timeStart),
      end_time: formatDateTime(timeControls.timeEnd),
      search_polys: getSearchPolyons(drawingState),
    };
  }, [timeControls.timeStart, timeControls.timeEnd, drawingState]);

  return aggregationRequest;
}

// Get the current stream from the URL
export function useCurrentCamera(cameraId: number) {
  return useQuery(
    ["stream", cameraId],
    async () => {
      return await CamerasService.getCamera(cameraId);
    },
    {
      refetchInterval: Duration.fromObject({
        seconds: 4,
      }).as("milliseconds"),
    }
  );
}

export function useThrottle(fn: () => void, throttleMs: number) {
  const lastTime = useRef<DateTime>(
    DateTime.now().minus({ milliseconds: throttleMs * 2 })
  );

  useEffect(() => {
    if (DateTime.now().diff(lastTime.current).as("milliseconds") < throttleMs) {
      return;
    }
    fn();
    lastTime.current = DateTime.now();
  }, [fn, throttleMs]);
}

export function useInitializeVideo(
  cameraResponse: CameraResponse,
  livePlayerOptions: VideoPlayerOptions,
  liveResolutionConfig: StaticResolutionConfig,
  clipPlayerOptions: VideoPlayerOptions,
  clipResolutionConfig: DynamicResolutionConfig | StaticResolutionConfig,
  clipSyncData: ClipTimeSyncData | null,
  onInitFromSyncTime: ((time: DateTime) => void) | undefined
) {
  // Player options
  const [playerOptions, setPlayerOptions] =
    useState<VideoPlayerOptions>(livePlayerOptions);
  // Kinesis request params
  const [kinesisOption, setKinesisOptions] = useState<KinesisVideoRequest>(
    () => ({
      requestType: "live",
      mac_address: cameraResponse.camera.mac_address,
      resolution_config: liveResolutionConfig,
      log_live_activity: true,
      prefer_webrtc: true,
    })
  );

  const timezone = getTimezoneFromCamera(cameraResponse);
  // Time controls for the timeline
  const [timeControls, setTimeControls] = useState<TimeInterval>({
    timeStart: DateTime.now().setZone(timezone).startOf("day"),
    timeEnd: DateTime.now().setZone(timezone).endOf("day"),
  });

  // If we have a sync time, apply it on mount
  useOnMount(() => {
    if (!isDefined(clipSyncData)) {
      return;
    }
    const startTime = clipSyncData.timeInterval.timeStart.setZone(timezone);
    const endTime = clipSyncData.timeInterval.timeEnd.setZone(timezone);

    setTimeControls({
      timeStart: startTime.startOf("day"),
      timeEnd: endTime.endOf("day"),
    });

    setKinesisOptions({
      requestType: "clip",
      mac_address: cameraResponse.camera.mac_address,
      start_time: formatDateTime(startTime),
      end_time: formatDateTime(endTime),
      resolution_config: clipResolutionConfig,
    });
    setPlayerOptions({
      ...clipPlayerOptions,
      initialSeekTime: clipSyncData.syncTime.diff(startTime).as("seconds"),
    });
    onInitFromSyncTime?.(startTime);
  });

  return {
    playerOptions,
    kinesisOption,
    timeControls,
    setKinesisOptions,
    setPlayerOptions,
    setTimeControls,
  };
}
