import { Typography } from "@mui/material";
import { DateTime } from "luxon";
import { toPascalCase } from "utils/globals";
import { timeZoneStrToHumanReadableTimezone } from "utils/time";
import { AccessLogCameraInfoMap } from "../types";

const MAC_ADDRESS_REGEX = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

export function renderDetails(
  details: Record<string, string>,
  cameraMap: AccessLogCameraInfoMap
) {
  if (!details) return;
  const newDetails = Object.entries(details)
    .filter(([key]) => key !== "url_path")
    .reduce((acc, [key, value]) => {
      if (key === "timezone") {
        value = timeZoneStrToHumanReadableTimezone(value);
      } else if (key.includes("time")) {
        value = DateTime.fromISO(value).toLocaleString(DateTime.DATETIME_FULL);
      } else if (MAC_ADDRESS_REGEX.test(value)) {
        // add an entry for the camera name
        const camera = cameraMap.get(value);
        if (camera) {
          acc["Camera Name"] = camera.name;
        }
      }
      acc[toPascalCase(key)] = value;
      return acc;
    }, {} as Record<string, string>);

  return (
    <Typography variant="body3" component={"pre"}>
      {JSON.stringify(newDetails, null, 4)}
    </Typography>
  );
}
