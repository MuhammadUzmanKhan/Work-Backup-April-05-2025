import { TextFieldValidated } from "components/TextFieldValidated";
import { DateTime } from "luxon";
import { useEffect, useRef, useState } from "react";
import { fixTimeString } from "utils/dates";
import { TIME_REGEX } from "coram-common-utils";

const TIME_FORMAT = "hh:mm a";

interface TimePickerProps {
  time: DateTime;
  placeholder?: string;
  setTime: (time: DateTime) => void;
  onBlur?: (ev: React.FocusEvent<HTMLInputElement>) => void;
}

export function TimePicker({
  time,
  placeholder,
  setTime,
  onBlur,
}: TimePickerProps) {
  const [localTime, setLocalTime] = useState<string>(
    time.toFormat(TIME_FORMAT)
  );
  const localTimeRef = useRef(localTime);
  localTimeRef.current = localTime;

  // Handle external updates to the original time
  // NOTE(@lberg): this is more complex than it should
  // to avoid the cursor jumping to the end of the input
  useEffect(() => {
    const timeFormatted = time.toFormat(TIME_FORMAT);
    const localTime = localTimeRef.current;
    // If the local time is not a valid time, reset it
    // when the time changes
    if (!localTime.match(TIME_REGEX)) {
      setLocalTime(timeFormatted);
      return;
    }
    // otherwise, update the local time only if the time changes
    const localTimeFormatted = DateTime.fromFormat(
      fixTimeString(localTime),
      "hh:mm:ss a"
    ).toFormat(TIME_FORMAT);
    if (localTimeFormatted !== timeFormatted) {
      setLocalTime(timeFormatted);
    }
  }, [time]);

  function handleTimeChange(value: string) {
    // Always update local time, allow the user to type freely
    setLocalTime(value);
    // If the value is a valid time, update the time state
    if (value.match(TIME_REGEX)) {
      // set the zone to the original time zone
      // and keep the date part
      const newTime = DateTime.fromFormat(fixTimeString(value), "hh:mm:ss a", {
        setZone: true,
        zone: time.zone,
      }).set({
        year: time.year,
        month: time.month,
        day: time.day,
      });
      setTime(newTime);
    }
  }

  return (
    <TextFieldValidated
      validator={(value) => TIME_REGEX.test(value)}
      placeholder={placeholder}
      value={localTime}
      sx={{
        "& .MuiOutlinedInput-input": {
          padding: "0.45rem 0.9rem",
          borderRadius: "0px",
          fontSize: "0.875rem",
        },
        "& .MuiOutlinedInput-root": {
          borderRadius: "0px",
        },
      }}
      variant="outlined"
      onChange={(event) => handleTimeChange(event.target.value)}
      onBlur={onBlur}
    />
  );
}
