import { DevicesService, Location } from "coram-common-utils";
import { CircularProgress, Switch, TableCell, Tooltip } from "@mui/material";
import { useContext, useState } from "react";
import { NotificationContext } from "contexts/notification_context";
import { Stack } from "@mui/system";

interface TimeManagementTableCellProps {
  location: Location;
  onChange: () => Promise<unknown>;
}

export function TimeManagementTableCell({
  location,
  onChange,
}: TimeManagementTableCellProps) {
  const { setNotificationData } = useContext(NotificationContext);

  const [updatePending, setUpdatePending] = useState(false);

  async function handleChange(flag: boolean) {
    setUpdatePending(true);
    try {
      await DevicesService.updateLocationEnableSettingTimezone({
        location_id: location.id,
        enable_setting_timezone: flag,
      });
    } catch (e) {
      setNotificationData({
        message: "Failed to update the location's Timezone Management.",
        severity: "error",
      });
      console.error(e);
    } finally {
      await onChange();
      setUpdatePending(false);
    }
  }

  // here we set checked to the opposite of the location's enable_setting_timezone
  // as frontend design is opposite of backend design for this feature
  return (
    <TableCell>
      <Stack gap={1} direction="row" alignItems="center">
        <Tooltip
          title={
            !location.enable_setting_timezone
              ? "You have enabled Automatic Time Management"
              : "You have disabled Automatic Time Management"
          }
        >
          <Switch
            disabled={updatePending}
            color="secondary"
            checked={!location.enable_setting_timezone}
            onChange={(_, isEnabled) => handleChange(!isEnabled)}
          />
        </Tooltip>
        {updatePending && <CircularProgress size={20} />}
      </Stack>
    </TableCell>
  );
}
