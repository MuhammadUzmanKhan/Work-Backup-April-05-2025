import { useState } from "react";
import { Box, MenuItem, type SelectProps, Typography } from "@mui/material";
import {
  ChevronRight as ChevronRightIcon,
  type SvgIconComponent,
} from "@mui/icons-material";
import { StyledSelect } from "components/styled_components/StyledSelect";
import { NestedMenuItem } from "./NestedMenuItem";
import { TimeInterval } from "utils/time";
import { CustomDatesSelector } from "./CustomDatesSelector";
import { DateTime, Duration } from "luxon";
import { isDefined } from "coram-common-utils";

export type AbsoluteDateRange = {
  type: "absolute";
  timeInterval: TimeInterval;
};

export type RelativeDateRange = {
  type: "relative";
  duration: Duration;
};

export type DateRange = AbsoluteDateRange | RelativeDateRange;

export interface RelativeTimeRangeOption {
  label: string;
  duration: Duration;
}

interface DateRangeSelectorProps {
  initialDateRange: DateRange;
  variant?: SelectProps["variant"];
  onDateRangeChange?: (dateRange: DateRange) => void;
  relativeTimeRangeOptions: RelativeTimeRangeOption[];
  enableAbsoluteDateRange?: boolean;
  Icon?: SvgIconComponent;
  fullWidth?: boolean;
}

const DEFAULT_ABSOLUTE_TIME_INTERVAL: TimeInterval = {
  timeStart: DateTime.now().minus({ day: 1 }),
  timeEnd: DateTime.now(),
};

export function DateRangeSelector({
  initialDateRange,
  variant = "outlined",
  onDateRangeChange,
  relativeTimeRangeOptions,
  enableAbsoluteDateRange = true,
  Icon,
  fullWidth = false,
}: DateRangeSelectorProps) {
  const [dateRange, setDateRange] = useState<DateRange>(initialDateRange);
  const [openSelect, setOpenSelect] = useState(false);

  function renderValue() {
    if (dateRange.type === "absolute") {
      const start = dateRange.timeInterval.timeStart.toFormat("MM/dd/yyyy");
      const end = dateRange.timeInterval.timeEnd.toFormat("MM/dd/yyyy");
      return `${start} - ${end}`;
    }

    const relativeTimeRange = relativeTimeRangeOptions.find(
      (option) =>
        option.duration.as("second") === dateRange.duration.as("second")
    );
    return relativeTimeRange?.label ?? "Select Date Range";
  }

  function getDateRangeValue() {
    return dateRange.type === "absolute"
      ? "absolute"
      : `relative_${dateRange.duration.as("second")}`;
  }

  function handleDateRangeChange(newDateRange: DateRange) {
    setDateRange(newDateRange);
    onDateRangeChange?.(newDateRange);
  }

  return (
    <StyledSelect
      displayEmpty
      variant={variant}
      open={openSelect}
      onOpen={() => setOpenSelect(true)}
      onClose={() => setOpenSelect(false)}
      value={getDateRangeValue()}
      renderValue={renderValue}
      disabled={!isDefined(onDateRangeChange)}
      inputProps={{
        sx: !isDefined(Icon) && { paddingRight: "0 !important" },
      }}
      IconComponent={() =>
        isDefined(Icon) ? (
          <Icon
            onClick={() => setOpenSelect(!openSelect)}
            fontSize="small"
            sx={{ color: "neutral.500", mr: 1, cursor: "pointer" }}
          />
        ) : null
      }
      fullWidth={fullWidth}
    >
      {relativeTimeRangeOptions.map((option) => (
        <MenuItem
          key={option.duration.as("second")}
          value={`relative_${option.duration.as("second")}`}
          onClickCapture={() =>
            handleDateRangeChange({
              type: "relative",
              duration: option.duration,
            })
          }
        >
          {option.label}
        </MenuItem>
      ))}
      {enableAbsoluteDateRange && (
        <NestedMenuItem
          value="absolute"
          renderLabel={() => (
            <Typography variant="body2" px="12px">
              Date Range
            </Typography>
          )}
          onClickCapture={(e) => {
            e.stopPropagation();
            handleDateRangeChange({
              type: "absolute",
              timeInterval:
                dateRange.type === "absolute"
                  ? dateRange.timeInterval
                  : DEFAULT_ABSOLUTE_TIME_INTERVAL,
            });
          }}
          parentMenuOpen={openSelect}
          subMenuOpen={dateRange.type === "absolute"}
          rightIcon={<ChevronRightIcon fontSize="small" />}
        >
          <Box px="12px" py="6px">
            <CustomDatesSelector
              timeInterval={
                dateRange.type === "absolute"
                  ? dateRange.timeInterval
                  : DEFAULT_ABSOLUTE_TIME_INTERVAL
              }
              setTimeInterval={(timeInterval) =>
                handleDateRangeChange({ type: "absolute", timeInterval })
              }
            />
          </Box>
        </NestedMenuItem>
      )}
    </StyledSelect>
  );
}
