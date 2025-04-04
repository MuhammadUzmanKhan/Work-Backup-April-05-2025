import { Stack } from "@mui/material";
import { NetworkScanScheduled } from "coram-common-utils";
import { timelineAlertIconColors } from "components/timeline/AlertUtils";
import { DaysOfWeekCheckboxes } from "components/user_alerts/DaysOfWeekCheckboxes";
import { TimePicker } from "features/timePicker/TimePicker";
import { networkTimeToDateTime, dateTimeToNetworkTime } from "./utils";

export function ScheduleUpdater({
  networkScanSettings,
  setLocalNetworkScanSettings,
}: {
  networkScanSettings: NetworkScanScheduled;
  setLocalNetworkScanSettings: (settings: NetworkScanScheduled) => void;
}) {
  return (
    <Stack direction="column" gap={1}>
      <DaysOfWeekCheckboxes
        days={networkScanSettings.days}
        setDays={(days) =>
          setLocalNetworkScanSettings({ ...networkScanSettings, days })
        }
        iconColors={timelineAlertIconColors}
      />

      <TimePicker
        time={networkTimeToDateTime(networkScanSettings.start_time)}
        placeholder="Start Time"
        setTime={(time) =>
          setLocalNetworkScanSettings({
            ...networkScanSettings,
            start_time: dateTimeToNetworkTime(time),
          })
        }
      />

      <TimePicker
        time={networkTimeToDateTime(networkScanSettings.end_time)}
        placeholder="End Time"
        setTime={(time) =>
          setLocalNetworkScanSettings({
            ...networkScanSettings,
            end_time: dateTimeToNetworkTime(time),
          })
        }
      />
    </Stack>
  );
}
