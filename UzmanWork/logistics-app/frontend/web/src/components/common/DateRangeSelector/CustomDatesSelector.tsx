import { useState } from "react";
import { DateRange as DateRangeIcon } from "@mui/icons-material";
import { IconButton, Stack, Typography } from "@mui/material";
import { CustomDatePicker } from "../CustomDatePicker";
import {
  ErrorState,
  handleEndTimeChange,
  handleStartTimeChange,
} from "components/timeline/utils";
import { TimeInterval } from "utils/time";
import { DEFAULT_TIMEZONE } from "coram-common-utils";

interface CustomDatesSelectorProps {
  timeInterval: TimeInterval;
  setTimeInterval: (timeInterval: TimeInterval) => void;
  timezone?: string;
  disabled?: boolean;
}

export function CustomDatesSelector({
  timezone = DEFAULT_TIMEZONE,
  timeInterval,
  timeInterval: { timeStart, timeEnd },
  setTimeInterval,
  disabled = false,
}: CustomDatesSelectorProps) {
  const [errors, setErrors] = useState<ErrorState>({
    isStartTimeInvalid: false,
    isEndTimeInvalid: false,
    isSubmitError: false,
    errorMessage: "",
  });

  return (
    <Stack>
      <Stack direction="row" gap={1} alignItems="center">
        <CustomDatePicker
          value={timeStart}
          disabled={disabled}
          onChange={(newTimeValue) => {
            handleStartTimeChange(
              newTimeValue,
              timezone,
              timeEnd,
              setErrors,
              (timeStart) => setTimeInterval({ ...timeInterval, timeStart })
            );
          }}
          label="Start Date"
          textFieldProps={{
            error: errors.isStartTimeInvalid,
            InputProps: {
              readOnly: true,
              endAdornment: (
                <IconButton>
                  <DateRangeIcon
                    fontSize="small"
                    sx={{ color: "neutral.500" }}
                  />
                </IconButton>
              ),
            },
          }}
        />
        <Typography>-</Typography>
        <CustomDatePicker
          value={timeEnd}
          disabled={disabled}
          onChange={(newTimeValue) => {
            handleEndTimeChange(
              newTimeValue,
              timezone,
              timeStart,
              setErrors,
              (timeEnd) => setTimeInterval({ ...timeInterval, timeEnd })
            );
          }}
          label="End Date"
          textFieldProps={{
            error: errors.isEndTimeInvalid,
            InputProps: {
              readOnly: true,
              endAdornment: (
                <IconButton>
                  <DateRangeIcon
                    fontSize="small"
                    sx={{ color: "neutral.500" }}
                  />
                </IconButton>
              ),
            },
          }}
        />
      </Stack>
      {errors.errorMessage && (
        <Typography variant="body2" sx={{ color: "red" }}>
          {`Error: ${errors.errorMessage}`}
        </Typography>
      )}
    </Stack>
  );
}
