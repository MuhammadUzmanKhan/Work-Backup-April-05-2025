import { useState, useRef } from "react";
import { TextFieldValidated } from "components/TextFieldValidated";
import { Button, Popover, Stack } from "@mui/material";
import { StaticDatePicker } from "@mui/x-date-pickers";
import type { TextFieldProps } from "@mui/material";
import { fixTimeString } from "utils/dates";
import { TIME_REGEX } from "coram-common-utils";

import { DateTime } from "luxon";

interface CustomDateTimePickerProps {
  value: DateTime;
  onChange: (value: DateTime) => void;
  label: string;
  textFieldProps?: TextFieldProps | undefined;
  disabled?: boolean;
  flexGrow?: number;
  minWidth?: string;
}

export function CustomDateTimePicker({
  value,
  label,
  textFieldProps,
  onChange,
  disabled = false,
  flexGrow,
  minWidth = "9rem",
}: CustomDateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [localDateTime, setLocalDateTime] = useState(value);
  const [localTime, setLocalTime] = useState(value.toFormat("hh:mm:ss a"));
  const [error, setError] = useState(false);
  const anchorEl = useRef<HTMLInputElement>(null);

  const onDateTimeChange = (time: string, date: DateTime) => {
    const newTime = DateTime.fromFormat(fixTimeString(time), "hh:mm:ss a");
    const newDateTime = date.startOf("day").set({
      hour: newTime.hour,
      minute: newTime.minute,
      second: newTime.second,
    });
    setLocalDateTime(newDateTime);
    // Call the onChange callback with the new DateTime
    onChange(newDateTime);
  };

  return (
    <>
      <TextFieldValidated
        disabled={disabled}
        inputRef={anchorEl}
        inputProps={{ "data-testid": "time-picker-value" }}
        validator={(value) => TIME_REGEX.test(value)}
        variant="outlined"
        onClick={() => {
          setLocalTime(value.toFormat("hh:mm:ss a"));
          setError(false);
          setOpen(true);
        }}
        value={value.toFormat("d LLL yyyy hh:mm:ss a")}
        label={label}
        {...textFieldProps}
        sx={{
          input: {
            cursor: "pointer",
            minWidth: minWidth,
            height: "1.4px",
          },
          borderBottom: "none",
          mt: 0,
          flexGrow: flexGrow,
        }}
      />
      <Popover
        open={open}
        anchorEl={anchorEl.current}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: -4,
          horizontal: "right",
        }}
        onClose={() => {
          setOpen(false);
          setLocalDateTime(value);
        }}
      >
        <StaticDatePicker
          maxDate={DateTime.now()}
          minDate={DateTime.now().minus({ months: 3 })}
          displayStaticWrapperAs="desktop"
          value={localDateTime}
          onChange={(newDate) => {
            if (!newDate) return;
            setLocalDateTime(newDate);
          }}
          slotProps={{
            toolbar: {
              hidden: true,
            },
          }}
          sx={{
            "& .MuiPickersCalendarHeader-labelContainer": {
              pointerEvents: "none",
            },
            "& .MuiPickersCalendarHeader-switchViewIcon": {
              display: "none",
            },
          }}
          shouldDisableMonth={() => {
            return false;
          }}
        />
        <Stack padding={2} mt={-3}>
          <TextFieldValidated
            validator={(value) => TIME_REGEX.test(value)}
            placeholder="hh:mm:ss"
            inputProps={{ "data-testid": "time-picker-time-change" }}
            value={localTime}
            variant="outlined"
            onChange={(newTime) => setLocalTime(newTime.target.value)}
            setError={setError}
            sx={{
              "& .MuiOutlinedInput-input": {
                padding: "0.45rem 0.9rem",
              },
            }}
            onKeyDown={(ev) => {
              if (ev.key !== "Enter" || error) {
                return;
              }
              setOpen(false);
              onDateTimeChange(localTime, localDateTime);
            }}
          />
          <Button
            data-testid="time-picker-done-button"
            color="secondary"
            variant="contained"
            disabled={error}
            sx={{ mt: "0.5rem", p: "2px" }}
            onClick={() => {
              setOpen(false);
              onDateTimeChange(localTime, localDateTime);
            }}
          >
            Done
          </Button>
        </Stack>
      </Popover>
    </>
  );
}
