import { TimeInterval } from "utils/time";
import { UptimeRecord } from "./types";
import { DateTime } from "luxon";
import { CameraDowntime } from "features/devices/types";

interface GetAverageCameraUptimeProps {
  cameraDowntimes: CameraDowntime[];
  timeInterval: TimeInterval;
  isOnline: boolean;
  lastSeenTime: DateTime;
}

export function getAverageCameraUptime({
  timeInterval,
  cameraDowntimes,
  isOnline,
  lastSeenTime,
}: GetAverageCameraUptimeProps) {
  // camera is offline for the entire time interval
  if (
    !isOnline &&
    lastSeenTime.toMillis() < timeInterval.timeStart.toMillis()
  ) {
    return 0;
  }

  const totalRangeMillis =
    timeInterval.timeEnd.toMillis() - timeInterval.timeStart.toMillis();

  let totalDowntimeMillis = cameraDowntimes.reduce(
    (acc, downtime) =>
      acc +
      downtime.downtime_end.toMillis() -
      downtime.downtime_start.toMillis(),
    0
  );

  if (!isOnline && lastSeenTime.toMillis() < timeInterval.timeEnd.toMillis()) {
    totalDowntimeMillis +=
      timeInterval.timeEnd.toMillis() - lastSeenTime.toMillis();
  }

  const totalUptimeMillis = totalRangeMillis - totalDowntimeMillis;
  return (totalUptimeMillis / totalRangeMillis) * 100;
}

interface PrepareUptimeDataProps {
  cameraDowntimes: CameraDowntime[];
  timeInterval: TimeInterval;
  cameraTimezone: string;
  isOnline: boolean;
  lastSeenTime: DateTime;
}

/*
  Generates uptime and downtime intervals for a camera based on its downtime records
  and the last time the camera was seen online. The camera is assumed to be online
  at all times except during the recorded downtimes. If the camera is currently offline,
  this period is treated as active downtime up until the last seen time.
 */
export function prepareUptimeData({
  cameraDowntimes,
  timeInterval,
  cameraTimezone,
  isOnline,
  lastSeenTime,
}: PrepareUptimeDataProps): UptimeRecord[] {
  // there are no recorded downtimes
  if (cameraDowntimes.length === 0) {
    return prepareUptimeDataWithNoDowntimesDetected(
      isOnline,
      timeInterval,
      cameraTimezone,
      lastSeenTime
    );
  }

  const sortedCameraDowntimes = cameraDowntimes
    .sort((a, b) => a.downtime_start.toMillis() - b.downtime_start.toMillis())
    .map((downtime) => ({
      timeStart: downtime.downtime_start.setZone(cameraTimezone),
      timeEnd: downtime.downtime_end.setZone(cameraTimezone),
    }));

  const data: UptimeRecord[] = [];

  if (
    timeInterval.timeStart.toMillis() <
    sortedCameraDowntimes[0].timeStart.toMillis()
  ) {
    data.push({
      type: "Online",
      interval: {
        timeStart: timeInterval.timeStart.setZone(cameraTimezone),
        timeEnd: sortedCameraDowntimes[0].timeStart,
      },
    });
  }

  sortedCameraDowntimes.forEach((downtime, index) => {
    data.push({
      type: "Offline",
      interval: {
        timeStart: downtime.timeStart,
        timeEnd: downtime.timeEnd,
      },
    });

    if (index < sortedCameraDowntimes.length - 1) {
      data.push({
        type: "Online",
        interval: {
          timeStart: downtime.timeEnd,
          timeEnd: sortedCameraDowntimes[index + 1].timeStart,
        },
      });
    }
  });

  const lastDowntimeEnd =
    sortedCameraDowntimes[sortedCameraDowntimes.length - 1].timeEnd;

  const isLastDowntimeEndBeforeIntervalTimeEnd =
    lastDowntimeEnd.toMillis() < timeInterval.timeEnd.toMillis();

  const isCameraOfflineBeforeIntervalTimeEnd =
    !isOnline && lastSeenTime.toMillis() < timeInterval.timeEnd.toMillis();

  // camera is online now and there is a gap between the last downtime end and the interval end.
  // we need to add an online record for this gap
  if (isOnline && isLastDowntimeEndBeforeIntervalTimeEnd) {
    data.push({
      type: "Online",
      interval: {
        timeStart: lastDowntimeEnd,
        timeEnd: timeInterval.timeEnd,
      },
    });
  } else if (isCameraOfflineBeforeIntervalTimeEnd) {
    // camera is offline now, but it may have been online after the last downtime ends
    // and the lastSeenTime
    if (lastDowntimeEnd.toMillis() < lastSeenTime.toMillis()) {
      data.push({
        type: "Online",
        interval: {
          timeStart: lastDowntimeEnd,
          timeEnd: lastSeenTime,
        },
      });
    }
    // camera was offline from the lastSeenTime to the interval end
    data.push({
      type: "Offline",
      interval: {
        timeStart: lastSeenTime,
        timeEnd: timeInterval.timeEnd,
      },
    });
  }

  return data;
}

function prepareUptimeDataWithNoDowntimesDetected(
  isOnline: boolean,
  timeInterval: TimeInterval,
  cameraTimezone: string,
  lastSeenTime: DateTime
): UptimeRecord[] {
  if (isOnline) {
    return [
      {
        type: "Online",
        interval: {
          timeStart: timeInterval.timeStart.setZone(cameraTimezone),
          timeEnd: timeInterval.timeEnd.setZone(cameraTimezone),
        },
      },
    ];
  }

  // Camera is Offline now

  if (lastSeenTime.toMillis() > timeInterval.timeStart.toMillis()) {
    // case 1, it somehow went offline after the interval start
    // this is a strange case as in this situation we should have a downtime record
    return [
      {
        type: "Online",
        interval: {
          timeStart: timeInterval.timeStart.setZone(cameraTimezone),
          timeEnd: lastSeenTime.setZone(cameraTimezone),
        },
      },
      {
        type: "Offline",
        interval: {
          timeStart: lastSeenTime.setZone(cameraTimezone),
          timeEnd: timeInterval.timeEnd.setZone(cameraTimezone),
        },
      },
    ];
  } else {
    // case 2, it went offline before the interval start, so it's offline for the entire interval
    return [
      {
        type: "Offline",
        interval: {
          timeStart: timeInterval.timeStart.setZone(cameraTimezone),
          timeEnd: timeInterval.timeEnd.setZone(cameraTimezone),
        },
      },
    ];
  }
}
