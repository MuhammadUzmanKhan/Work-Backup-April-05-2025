import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useCameraDowntime } from "features/devices/hooks";
import { DateTime, Duration } from "luxon";
import { DateRangeSelector } from "components/common";
import { RELATIVE_TIME_RANGE_OPTIONS } from "./consts";
import { DateRange as DateRangeIcon } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { getAverageCameraUptime, prepareUptimeData } from "./utils";
import { HealthChart } from "./components";
import { useUpdatedTimeInterval } from "./hooks";
import { UptimeRecord } from "./types";
import { useCamerasTimezones, DEFAULT_TIMEZONE } from "coram-common-utils";

interface HealthTabProps {
  cameraId: number;
  cameraMacAddress: string;
  isOnline: boolean;
  lastSeenTime: DateTime;
}

export function HealthTab({
  cameraId,
  cameraMacAddress,
  isOnline,
  lastSeenTime,
}: HealthTabProps) {
  const { timeInterval, updateTimeInterval } = useUpdatedTimeInterval();

  // When we have loaded the data at least once, it becomes true, when we updateTimeInterval with DateRangeSelector
  // we reset it to false
  const [hasInitiallyLoadedForDateRange, setHasInitiallyLoadedForDateRange] =
    useState(false);

  const {
    data: cameraDowntimes,
    isLoading: isLoadingCameraDowntimes,
    isFetched: isCameraDowntimesFetched,
  } = useCameraDowntime(cameraId, timeInterval);

  useEffect(() => {
    if (isCameraDowntimesFetched) {
      setHasInitiallyLoadedForDateRange(true);
    }
  }, [isCameraDowntimesFetched]);

  const camerasTimezones = useCamerasTimezones({});
  const cameraTimezone =
    camerasTimezones.get(cameraMacAddress) ?? DEFAULT_TIMEZONE;

  const [averageUptime, setAverageUptime] = useState<number>(100);
  const [uptimeData, setUptimeData] = useState<UptimeRecord[]>([]);

  // We want to update uptimeData and averageUptime in effect only when data is loaded. For relative time ranges,
  // we periodically refetch the data and during this refetch we don't want to update averageUptime
  // and uptimeData as it will cause the chart to flicker from 100% to actual uptime and back to 100%.
  useEffect(() => {
    if (isLoadingCameraDowntimes) {
      return;
    }

    setUptimeData(
      prepareUptimeData({
        cameraDowntimes,
        timeInterval,
        cameraTimezone,
        isOnline,
        lastSeenTime,
      })
    );
    setAverageUptime(
      getAverageCameraUptime({
        cameraDowntimes,
        timeInterval,
        isOnline,
        lastSeenTime,
      })
    );
  }, [
    isLoadingCameraDowntimes,
    cameraDowntimes,
    timeInterval,
    cameraTimezone,
    isOnline,
    lastSeenTime,
  ]);

  return (
    <Stack pt={1} gap={2}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        pr={3}
      >
        <Box width="300px">
          <DateRangeSelector
            initialDateRange={{
              type: "relative",
              duration: Duration.fromObject({ hour: 24 }),
            }}
            onDateRangeChange={(dateRange) => {
              updateTimeInterval(dateRange);
              setHasInitiallyLoadedForDateRange(false);
            }}
            Icon={DateRangeIcon}
            relativeTimeRangeOptions={RELATIVE_TIME_RANGE_OPTIONS}
          />
        </Box>
        {hasInitiallyLoadedForDateRange && (
          <Typography>Average Uptime: {averageUptime.toFixed(2)}%</Typography>
        )}
      </Stack>
      {!hasInitiallyLoadedForDateRange ? (
        <Stack alignItems="center" justifyContent="center" height="300px">
          <CircularProgress size={45} color="secondary" />
        </Stack>
      ) : (
        <HealthChart timeInterval={timeInterval} uptimeData={uptimeData} />
      )}
    </Stack>
  );
}
