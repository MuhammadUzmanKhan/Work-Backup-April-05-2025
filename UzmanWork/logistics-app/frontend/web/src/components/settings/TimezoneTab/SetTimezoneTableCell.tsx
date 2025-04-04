import { TableCell, Typography } from "@mui/material";
import { timeZoneStrToHumanReadableTimezone } from "utils/time";
import { useContext, useState } from "react";
import { NotificationContext } from "contexts/notification_context";
import { DevicesService, Location } from "coram-common-utils";
import { StyledAutocomplete } from "components/styled_components/StyledAutocomplete";

const PREFERRED_TIMEZONES_ORDER = [
  "America/Los_Angeles",
  "America/New_York",
  "America/Denver",
  "America/Adak",
  "America/Chicago",
  "America/Detroit",
  "Europe/London",
];

const SUPPORTED_TIMEZONES = [
  ...PREFERRED_TIMEZONES_ORDER,
  ...Intl.supportedValuesOf("timeZone").filter(
    (tz) => !PREFERRED_TIMEZONES_ORDER.includes(tz)
  ),
];

interface SetTimezoneTableCellProps {
  location: Location;
  onChange: () => Promise<unknown>;
}

export function SetTimezoneTableCell({
  location,
  onChange,
}: SetTimezoneTableCellProps) {
  const { setNotificationData } = useContext(NotificationContext);

  const [updatePending, setUpdatePending] = useState(false);

  async function handleTimeZoneChange(timezone: string) {
    setUpdatePending(true);
    try {
      await DevicesService.updateLocationTimezone({
        location_id: location.id,
        timezone,
      });
    } catch (e) {
      setNotificationData({
        message: "Failed to update the location's timezone.",
        severity: "error",
      });
      console.error(e);
    } finally {
      await onChange();
      setUpdatePending(false);
    }
  }

  return (
    <TableCell>
      <StyledAutocomplete
        onChange={(_, value) => handleTimeZoneChange(value)}
        value={location.timezone ?? ""}
        disabled={!location.enable_setting_timezone}
        getOptionLabel={timeZoneStrToHumanReadableTimezone}
        noOptionsText={
          <Typography fontSize="13px">No Timezones found</Typography>
        }
        showProgress={updatePending}
        disableClearable
        options={SUPPORTED_TIMEZONES}
        fullWidth
      />
    </TableCell>
  );
}
