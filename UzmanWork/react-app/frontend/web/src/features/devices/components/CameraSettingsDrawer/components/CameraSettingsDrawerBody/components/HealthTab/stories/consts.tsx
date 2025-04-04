import { randomCameraResponses } from "stories/utils_stories";
import { DateTime } from "luxon";
import { GetCameraDowntimeResponse } from "coram-common-utils";

const cameras = randomCameraResponses(3);
export const OFFLINE_CAMERA_WITH_DOWNTIME_RESPONSE = cameras[0];
OFFLINE_CAMERA_WITH_DOWNTIME_RESPONSE.camera.is_online = false;
OFFLINE_CAMERA_WITH_DOWNTIME_RESPONSE.camera.last_seen_time = DateTime.now()
  .minus({ hour: 6 })
  .toISO() as string;

export const OFFLINE_CAMERA_WITHOUT_DOWNTIME_RESPONSE = cameras[1];
OFFLINE_CAMERA_WITHOUT_DOWNTIME_RESPONSE.camera.is_online = false;
OFFLINE_CAMERA_WITHOUT_DOWNTIME_RESPONSE.camera.last_seen_time =
  "2024-04-08T23:49:05.286729+00:00";

export const ONLINE_CAMERA_WITHOUT_DOWNTIME_RESPONSE = cameras[2];
ONLINE_CAMERA_WITHOUT_DOWNTIME_RESPONSE.camera.is_online = true;
ONLINE_CAMERA_WITHOUT_DOWNTIME_RESPONSE.camera.last_seen_time =
  DateTime.now().toISO() as string;

export const CAMERAS = [
  OFFLINE_CAMERA_WITH_DOWNTIME_RESPONSE,
  OFFLINE_CAMERA_WITHOUT_DOWNTIME_RESPONSE,
  ONLINE_CAMERA_WITHOUT_DOWNTIME_RESPONSE,
];

export const CAMERA_DOWNTIME_RESPONSE: GetCameraDowntimeResponse = {
  downtimes: [
    {
      id: 1,
      camera_mac_address:
        OFFLINE_CAMERA_WITH_DOWNTIME_RESPONSE.camera.mac_address,
      downtime_start: DateTime.now().minus({ hour: 12 }).toISO() as string,
      downtime_end: DateTime.now().minus({ hour: 11 }).toISO() as string,
    },
    {
      id: 2,
      camera_mac_address:
        OFFLINE_CAMERA_WITH_DOWNTIME_RESPONSE.camera.mac_address,
      downtime_start: DateTime.now().minus({ hour: 9 }).toISO() as string,
      downtime_end: DateTime.now().minus({ hour: 8 }).toISO() as string,
    },
  ],
};

export const NO_CAMERA_DOWNTIMES: GetCameraDowntimeResponse = {
  downtimes: [],
};
