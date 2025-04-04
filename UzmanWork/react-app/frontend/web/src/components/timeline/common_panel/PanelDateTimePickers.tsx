import { Stack, type TextFieldProps, type SxProps } from "@mui/material";
import { CustomDateTimePicker } from "../custom_datepicker/CustomDatePicker";
import {
  ErrorState,
  handleEndTimeChange,
  handleStartTimeChange,
} from "../utils";
import { PanelErrorDisplay } from "./PanelErrorDisplay";
import { DateTime, Duration } from "luxon";

export interface PanelDateTimePickersProps {
  timezone: string;
  startTime: DateTime;
  endTime: DateTime;
  setStartTime: (newTimeValue: DateTime) => void;
  setEndTime: (newTimeValue: DateTime) => void;
  errors: ErrorState;
  setErrors: React.Dispatch<React.SetStateAction<ErrorState>>;
  maxDurationBetweenStartAndEndTime?: Duration;
  maxDurationBetweenStartAndEndTimeText?: string;
  maxDurationBetweenStartTimeAndNow?: Duration;
  textFieldProps?: TextFieldProps | undefined;
  disabled?: boolean;
  direction?: "row" | "column";
  flexGrow?: number;
  dateFieldMinWidth?: string;
  containerSx?: SxProps;
}

export function PanelDateTimePickers({
  timezone,
  startTime,
  endTime,
  setStartTime,
  setEndTime,
  errors,
  setErrors,
  maxDurationBetweenStartAndEndTime,
  maxDurationBetweenStartAndEndTimeText,
  maxDurationBetweenStartTimeAndNow,
  textFieldProps,
  disabled = false,
  direction = "column",
  flexGrow,
  dateFieldMinWidth = undefined,
  containerSx = undefined,
}: PanelDateTimePickersProps) {
  return (
    <Stack gap={1.5} sx={containerSx}>
      <PanelErrorDisplay errorMessage={errors.errorMessage} />
      <Stack gap={1.5} direction={direction}>
        <CustomDateTimePicker
          value={startTime}
          disabled={disabled}
          onChange={(newTimeValue) => {
            handleStartTimeChange(
              newTimeValue,
              timezone,
              endTime,
              setErrors,
              (time) => setStartTime(time),
              maxDurationBetweenStartAndEndTime,
              maxDurationBetweenStartAndEndTimeText,
              maxDurationBetweenStartTimeAndNow
            );
          }}
          label="Start Time"
          textFieldProps={{
            error: errors.isStartTimeInvalid,
            InputProps: {
              readOnly: true,
            },
            ...textFieldProps,
          }}
          flexGrow={flexGrow}
          minWidth={dateFieldMinWidth}
        />
        <CustomDateTimePicker
          value={endTime}
          disabled={disabled}
          onChange={(newTimeValue) => {
            handleEndTimeChange(
              newTimeValue,
              timezone,
              startTime,
              setErrors,
              (time) => setEndTime(time),
              maxDurationBetweenStartAndEndTime,
              maxDurationBetweenStartAndEndTimeText
            );
          }}
          label="End Time"
          textFieldProps={{
            error: errors.isEndTimeInvalid,
            InputProps: {
              readOnly: true,
            },
            ...textFieldProps,
          }}
          flexGrow={flexGrow}
          minWidth={dateFieldMinWidth}
        />
      </Stack>
    </Stack>
  );
}
