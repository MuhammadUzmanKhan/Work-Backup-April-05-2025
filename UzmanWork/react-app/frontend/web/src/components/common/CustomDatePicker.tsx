import { useState, useRef } from "react";
import { TextFieldValidated } from "components/TextFieldValidated";
import { Button, Popover, Stack } from "@mui/material";
import { StaticDatePicker } from "@mui/x-date-pickers";
import type { TextFieldProps } from "@mui/material";
import { TIME_REGEX } from "coram-common-utils";
import { DateTime } from "luxon";

interface CustomDateTimePickerProps {
  value: DateTime;
  onChange: (value: DateTime) => void;
  label: string;
  textFieldProps?: TextFieldProps | undefined;
  disabled?: boolean;
  flexGrow?: number;
}
// TODO:move all the pickers in a subfolder, we have several spread everywhere
export function CustomDatePicker({
  value,
  label,
  textFieldProps,
  onChange,
  disabled = false,
  flexGrow,
}: CustomDateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [localDateTime, setLocalDateTime] = useState(value);
  const [error, setError] = useState(false);
  const anchorEl = useRef<HTMLInputElement>(null);

  return (
    <>
      <TextFieldValidated
        disabled={disabled}
        inputRef={anchorEl}
        inputProps={{ "data-testid": "time-picker-value" }}
        validator={(value) => TIME_REGEX.test(value)}
        variant="outlined"
        onClick={() => {
          setError(false);
          setOpen(true);
        }}
        value={value.toFormat("d LLL yyyy")}
        label={label}
        {...textFieldProps}
        sx={{
          input: {
            fontSize: "11px",
            cursor: "pointer",
            width: "4.5rem",
            height: "1.4px",
            fontWeight: "600",
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
          vertical: "top",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
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
        <Stack padding={1} mt={-3}>
          <Button
            data-testid="time-picker-done-button"
            color="secondary"
            variant="contained"
            disabled={error}
            sx={{ mt: "0.5rem", p: "2px" }}
            onClick={() => {
              setOpen(false);
              setLocalDateTime(localDateTime);
              onChange(localDateTime);
            }}
          >
            Apply
          </Button>
        </Stack>
      </Popover>
    </>
  );
}
