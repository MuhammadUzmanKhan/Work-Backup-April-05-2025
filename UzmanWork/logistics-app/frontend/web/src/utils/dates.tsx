import { DateTime } from "luxon";

export function formatDateTime(time: DateTime) {
  return time.toISO() || "invalid date";
}

// Time string sanitizer to fixed the invalid dates i.e 3am to 3:00:00 AM
export function fixTimeString(timeString: string): string {
  // Convert input to lowercase and remove any spaces
  timeString = timeString.toLowerCase().replace(/\s/g, "");

  // Check if input ends with "am" or "pm"
  const isPM = timeString.endsWith("pm");

  // Remove "am" or "pm" from the input string
  timeString = timeString.slice(0, -2);

  // Split the input into hours minutes and seconds
  const [hours, minutes, seconds] = timeString
    .split(":")
    .map((part) => parseInt(part));

  // Check if hours are less than 10 and add leading zero if required
  let fixedHours = hours.toString();
  if (hours < 10) {
    fixedHours = `0${hours}`;
  }

  // Check if minutes are less than 10 and add leading zero if required
  let fixedMinutes = "00";
  if (!isNaN(minutes)) {
    if (minutes < 10) {
      fixedMinutes = `0${minutes}`;
    } else {
      fixedMinutes = minutes.toString();
    }
  }
  // Check if seconds are less than 10 and add leading zero if required
  let fixedSeconds = "00";
  if (!isNaN(seconds)) {
    if (seconds < 10) {
      fixedSeconds = `0${seconds}`;
    } else {
      fixedSeconds = seconds.toString();
    }
  }

  // Build the final time string
  let fixedTimeString = `${fixedHours}:${fixedMinutes}:${fixedSeconds}`;
  if (isPM && hours <= 12) {
    fixedTimeString += " PM";
  } else if (!isPM && hours <= 12) {
    fixedTimeString += " AM";
  }

  return fixedTimeString;
}

// Replaces the timezone of a DateTime object.
// This does NOT convert between timezones, but rather just replaces the timezone.
// e.g (2021-01-01 12:00:00 UTC, "America/Los_Angeles") -> 2021-01-01 12:00:00 PST,
export function replaceTimezone(time: DateTime, timezone: string) {
  return time.setZone(timezone, { keepLocalTime: true });
}
