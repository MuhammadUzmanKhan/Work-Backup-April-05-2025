import { Stack, Typography } from "@mui/material";
import { Duration } from "luxon";
import { DateRange, DateRangeSelector } from "components/common";

interface DurationOption {
  label: string;
  duration: Duration;
}

interface DurationSelectorProps {
  name: string;
  duration: Duration;
  setDuration: (duration: Duration) => void;
  durationOptions: DurationOption[];
}

export function DurationSelector({
  name,
  duration,
  setDuration,
  durationOptions,
}: DurationSelectorProps) {
  function handleDurationChange(dateRange: DateRange) {
    if (dateRange.type === "relative") {
      setDuration(dateRange.duration);
    }
  }

  return (
    <Stack gap={1}>
      <Typography variant="body1" color="#83889E">
        {name}
      </Typography>
      <DateRangeSelector
        initialDateRange={{
          type: "relative",
          duration: duration,
        }}
        onDateRangeChange={handleDurationChange}
        relativeTimeRangeOptions={durationOptions}
        enableAbsoluteDateRange={false}
        fullWidth={true}
      />
    </Stack>
  );
}
