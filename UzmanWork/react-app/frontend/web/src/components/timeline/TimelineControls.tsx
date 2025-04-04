import { Box, Stack, Typography } from "@mui/material";
import type { SxProps } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { fixTimeString } from "utils/dates";
import { TIME_REGEX } from "coram-common-utils";
import { DateTime } from "luxon";
import { DesktopDateTimePicker } from "./DesktopDateTImePicker";
import { useIsMobile } from "components/layout/MobileOnly";
import { MobileDateTimePicker } from "./mobile_date_picker/MobileDateTimePicker";

interface TimelineControlsProps {
  videoTime: DateTime;
  timezone: string;
  onTimeChange: (time: DateTime) => void;
  sx?: SxProps;
  preDateElement?: React.ReactNode;
  postDateElement?: React.ReactNode;
}

export function TimelineControls({
  videoTime,
  timezone,
  onTimeChange,
  sx,
  preDateElement,
  postDateElement,
}: TimelineControlsProps) {
  const isMobile = useIsMobile();
  // States to manage date picker
  const [open, setOpen] = useState<boolean>(false);
  const [time, setTime] = useState<string>(videoTime.toFormat("hh:mm:ss a"));
  const [date, setDate] = useState<DateTime>(videoTime);

  const anchorEl = useRef<HTMLButtonElement>(null);

  const [selectedVideoTime, setSelectedVideoTime] = useState<DateTime>(
    videoTime.isValid ? videoTime : DateTime.now().setZone(timezone)
  );

  // Update the last video time when the video time changes and we have not opened the time picker
  useEffect(() => {
    if (videoTime.isValid && !open) {
      setSelectedVideoTime(videoTime);
    }
  }, [videoTime, open]);

  // Update the component when we change the time in the picker
  const handleTimeChange = (
    time: string,
    date: DateTime,
    invokeCallback: boolean
  ) => {
    // We always set the value, even if it doesn't match the regex
    setTime(time);
    setDate(date);
    // Check if the new time matches the time regex
    if (time.match(TIME_REGEX)) {
      const timeAsDate = DateTime.fromFormat(fixTimeString(time), "hh:mm:ss a");
      const newTime = date
        .startOf("day")
        .set({
          hour: timeAsDate.hour,
          minute: timeAsDate.minute,
          second: timeAsDate.second,
        })
        .setZone(timezone, { keepLocalTime: true });
      // Check if the new time is after the current time
      const now = DateTime.now().setZone(timezone);
      if (newTime > now) {
        setTime(now.toFormat("hh:mm:ss a"));
      }
      // Call the onTimeChange callback with the new valid time
      if (invokeCallback) {
        onTimeChange(newTime);
      }
    }
  };

  return (
    <Box
      sx={{
        cursor: "pointer",
        border: "1px solid #e6e8f0",
        backgroundColor: "neutral.A200",
        borderRadius: "0.4rem",
        padding: "0.1rem 1rem",
        minWidth: "10rem",
        minHeight: "10px",
        ...sx,
      }}
    >
      <Box
        ref={anchorEl}
        onClick={() => {
          setOpen(true);
          setTime(
            selectedVideoTime.isValid
              ? selectedVideoTime.toFormat("hh:mm:ss a")
              : ""
          );

          setDate(selectedVideoTime.startOf("day"));
        }}
      >
        <Typography
          variant="body2"
          display={"flex"}
          alignItems="center"
          justifyContent="center"
          color="neutral.700"
        >
          {preDateElement}
          {selectedVideoTime.isValid
            ? selectedVideoTime.toFormat("d MMM")
            : "-- ---"}
          {postDateElement}
          {selectedVideoTime.isValid ? (
            <Stack direction="row">
              <Typography minWidth="2.8rem" variant="body2">
                {selectedVideoTime.toFormat("h:mm:ss")}
              </Typography>
              <Typography variant="body2">
                {selectedVideoTime.toFormat("a")}
              </Typography>
            </Stack>
          ) : (
            "--:--:-- --"
          )}
        </Typography>
      </Box>

      {isMobile ? (
        <MobileDateTimePicker
          open={open}
          timezone={timezone}
          currDate={date}
          currTime={time}
          onDateTimeChange={handleTimeChange}
          onClose={() => setOpen(false)}
        />
      ) : (
        <DesktopDateTimePicker
          open={open}
          timezone={timezone}
          anchorEl={anchorEl.current}
          currDate={date}
          currTime={time}
          onDateTimeChange={handleTimeChange}
          onClose={() => setOpen(false)}
        />
      )}
    </Box>
  );
}
