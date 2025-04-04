import { DateTime } from "luxon";
import Popover from "@mui/material/Popover";
import { StaticDatePicker } from "@mui/x-date-pickers";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { TIME_REGEX } from "coram-common-utils";
import { TextFieldValidated } from "components/TextFieldValidated";

interface DesktopDateTimePickerProps {
  open: boolean;
  timezone: string;
  anchorEl: Element | null;
  currDate: DateTime;
  currTime: string;
  onDateTimeChange: (
    time: string,
    date: DateTime,
    invokeCallback: boolean
  ) => void;
  onClose: VoidFunction;
}

export function DesktopDateTimePicker({
  open,
  timezone,
  anchorEl,
  currDate,
  currTime,
  onDateTimeChange,
  onClose,
}: DesktopDateTimePickerProps) {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      anchorReference="anchorEl"
      onClose={onClose}
    >
      <StaticDatePicker
        maxDate={DateTime.now().setZone(timezone)}
        minDate={DateTime.now().minus({ months: 3 }).setZone(timezone)}
        displayStaticWrapperAs="desktop"
        value={currDate}
        onChange={(newValue) => {
          if (!newValue) return;
          onDateTimeChange(currTime, newValue, false);
        }}
        sx={{
          "& .MuiPickersCalendarHeader-switchViewIcon": {
            display: "none",
          },
          "& .MuiPickersCalendarHeader-labelContainer": {
            pointerEvents: "none",
          },
        }}
        slotProps={{
          toolbar: {
            hidden: true,
          },
        }}
      />
      <Stack padding={2} mt={-3}>
        <TextFieldValidated
          validator={(value) => TIME_REGEX.test(value)}
          placeholder="hh:mm:ss"
          value={currTime}
          sx={{
            "& .MuiOutlinedInput-input": {
              padding: "0.45rem 0.9rem",
            },
          }}
          variant="outlined"
          onChange={(event) => {
            onDateTimeChange(event.target.value, currDate, false);
          }}
        />

        <Button
          color="secondary"
          variant="contained"
          sx={{ mt: "0.5rem", p: "2px" }}
          onClick={() => {
            onDateTimeChange(currTime, currDate, true);
            onClose();
          }}
        >
          Done
        </Button>
      </Stack>
    </Popover>
  );
}
