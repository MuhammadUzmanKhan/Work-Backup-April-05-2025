import { Box, Divider, Drawer, Stack, Typography } from "@mui/material";
import { StaticDatePicker } from "@mui/x-date-pickers";
import { TextFieldValidated } from "components/TextFieldValidated";
import { ActionButton } from "components/styled_components/ActionButton";
import { DateTime } from "luxon";
import { TIME_REGEX } from "coram-common-utils";

interface MobileDateTimePickerProps {
  open: boolean;
  timezone: string;
  currDate: DateTime;
  currTime: string;
  onDateTimeChange: (
    time: string,
    date: DateTime,
    invokeCallback: boolean
  ) => void;
  onClose: VoidFunction;
}

interface DateTimePickerProps {
  timezone: string;
  currDate: DateTime;
  currTime: string;
  onDateTimeChange: (
    time: string,
    date: DateTime,
    invokeCallback: boolean
  ) => void;
  onClose: VoidFunction;
}

function PickerActionButtons({
  handleSubmit,
  onClose,
}: {
  handleSubmit: VoidFunction;
  onClose: VoidFunction;
}) {
  const padding = 2;
  return (
    <>
      <Stack
        direction="row"
        justifyContent="space-between"
        px={1}
        py={2}
        borderBottom="1px solid"
        borderColor="divider"
      >
        <ActionButton onClick={onClose}>
          <Typography variant="h3">Cancel</Typography>
        </ActionButton>
        <ActionButton onClick={handleSubmit}>
          <Typography variant="h3" color="secondary">
            Done
          </Typography>
        </ActionButton>
      </Stack>
      <Divider sx={{ mx: -padding }} />
    </>
  );
}

function DateTimePicker({
  timezone,
  currDate,
  currTime,
  onDateTimeChange,
  onClose,
}: DateTimePickerProps) {
  const padding = 2.5;
  return (
    <Stack
      sx={{
        height: "auto",
        justifyContent: "center",
        px: padding,
        pb: padding,
      }}
    >
      <PickerActionButtons
        onClose={onClose}
        handleSubmit={() => {
          onDateTimeChange(currTime, currDate, true);
          onClose();
        }}
      />
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
            fontWeight: "bold",
          },
        }}
        slotProps={{
          toolbar: {
            hidden: true,
          },
        }}
      />
      <Stack mt={-padding} gap={1}>
        <Typography variant="body1">Time:</Typography>
        <TextFieldValidated
          validator={(value) => TIME_REGEX.test(value)}
          placeholder="hh:mm:ss"
          value={currTime}
          sx={{
            width: "100%",
            "& .MuiOutlinedInput-input": {
              padding: "0.45rem 0.9rem",
            },
          }}
          variant="outlined"
          onChange={(event) => {
            onDateTimeChange(event.target.value, currDate, false);
          }}
        />
      </Stack>
    </Stack>
  );
}

// This is a custom mobile date picker at the bottom of the screen which should be used on mobile devices
export function MobileDateTimePicker({
  open,
  currDate,
  currTime,
  timezone,
  onDateTimeChange,
  onClose,
}: MobileDateTimePickerProps) {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: "8px 8px 0 0",
        },
      }}
    >
      <Box pb="env(safe-area-inset-bottom)">
        <DateTimePicker
          currDate={currDate}
          currTime={currTime}
          timezone={timezone}
          onDateTimeChange={onDateTimeChange}
          onClose={onClose}
        />
      </Box>
    </Drawer>
  );
}
