import { Stack } from "@mui/material";
import { PanelErrorDisplay } from "components/timeline/common_panel/PanelErrorDisplay";
import { INITIAL_ERROR_STATE } from "components/timeline/common_panel/PanelSubmitButton";
import { CustomDateTimePicker } from "components/timeline/custom_datepicker/CustomDatePicker";
import {
  ErrorState,
  handleEndTimeChange,
  handleStartTimeChange,
} from "components/timeline/utils";
import { useState } from "react";
import { TimeInterval } from "utils/time";

interface DateRangeSelectorsProps {
  timeInterval: TimeInterval;
  setTimeInterval: (timeInterval: TimeInterval) => void;
  timezone: string;
  disabled?: boolean;
}

export function DateRangeSelectors({
  timezone,
  timeInterval,
  timeInterval: { timeStart, timeEnd },
  setTimeInterval,
  disabled = false,
}: DateRangeSelectorsProps) {
  const [errors, setErrors] = useState<ErrorState>(INITIAL_ERROR_STATE);
  return (
    <Stack>
      <Stack direction="row" gap={2}>
        <CustomDateTimePicker
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
          label="Start Time"
          textFieldProps={{
            error: errors.isStartTimeInvalid,
            InputProps: {
              readOnly: true,
            },
          }}
        />
        <CustomDateTimePicker
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
          label="End Time"
          textFieldProps={{
            error: errors.isEndTimeInvalid,
            InputProps: {
              readOnly: true,
            },
          }}
        />
      </Stack>
      <PanelErrorDisplay errorMessage={errors.errorMessage} />
    </Stack>
  );
}
