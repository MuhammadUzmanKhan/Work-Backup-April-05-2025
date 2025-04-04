import { Divider, Stack, TextField } from "@mui/material";

import {
  DetectionObjectTypeCategory,
  FeatureFlags,
  UserAlertSettingCreate,
  TriggerType,
} from "coram-common-utils";
import { DaysOfWeekCheckboxes } from "components/user_alerts/DaysOfWeekCheckboxes";
import { NotifyOptions } from "components/user_alerts/NotifyOptions";
import { ObjectTypeSelector } from "components/user_alerts/ObjectTypeSelector";
import { RegionSelector } from "components/user_alerts/RegionSelector";
import { AlertTriggerSelector } from "components/user_alerts/AlertTriggerSelector";
import { Dispatch, useState, SetStateAction } from "react";
import { timelineAlertIconColors } from "./AlertUtils";
import { PanelSectionHeader } from "./common_panel/PanelSectionHeader";
import { useFeatureEnabled } from "utils/globals";
import { DateTime } from "luxon";
import { TimePicker } from "features/timePicker/TimePicker";

export const MaxValidIdleTimeSeconds = 86400;
export const MinValidIdleTimeSeconds = 10;

interface UserAlertFormProps {
  alertSettings: UserAlertSettingCreate;
  setAlertSettings: Dispatch<SetStateAction<UserAlertSettingCreate>>;
  aggregatedObjectTypes: Set<DetectionObjectTypeCategory>;
  setAggregatedObjectTypes: Dispatch<
    SetStateAction<Set<DetectionObjectTypeCategory>>
  >;
  startTime: DateTime;
  setStartTime: Dispatch<SetStateAction<DateTime>>;
  endTime: DateTime;
  setEndTime: Dispatch<SetStateAction<DateTime>>;
}

export function UserAlertForm({
  alertSettings,
  setAlertSettings,
  aggregatedObjectTypes,
  setAggregatedObjectTypes,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
}: UserAlertFormProps) {
  // Set state to determine to show the idle time field or not
  const idleAlertEnabled = useFeatureEnabled(FeatureFlags.IDLE_ALERT_ENABLED);
  const showIdleTime =
    alertSettings.trigger_type === TriggerType.IDLING
      ? idleAlertEnabled
      : false;

  const [idleDurationS, setIdleDurationS] = useState<number>(0);
  const [idleTimeError, setIdleTimeError] = useState<boolean>(false);
  const [idleTimeHelperText, setIdleTimeHelperText] = useState<string>("");
  const handleIdleTimeChange = (inputText: string) => {
    const inputValue = inputText ? parseInt(inputText, 10) : 0;
    if (
      inputValue >= MinValidIdleTimeSeconds &&
      inputValue <= MaxValidIdleTimeSeconds
    ) {
      setIdleTimeError(false);
      setIdleDurationS(inputValue);
      setAlertSettings({
        ...alertSettings,
        min_idle_duration_s: inputValue,
      });
    } else {
      setIdleTimeError(true);
      setIdleTimeHelperText(
        "Please enter a valid value between" +
          MinValidIdleTimeSeconds +
          " and " +
          MaxValidIdleTimeSeconds +
          "."
      );
      setIdleDurationS(inputValue);
    }
  };

  return (
    <Stack spacing={1}>
      <PanelSectionHeader title="Region" />
      <RegionSelector iconColors={timelineAlertIconColors} />
      <Divider sx={{ width: "100%" }} />
      <PanelSectionHeader title="Objects" />
      <ObjectTypeSelector
        aggregatedObjectTypes={aggregatedObjectTypes}
        setAggregatedObjectTypes={setAggregatedObjectTypes}
        iconColors={timelineAlertIconColors}
      />
      <Divider sx={{ width: "100%" }} />
      <PanelSectionHeader title="Days" />
      <DaysOfWeekCheckboxes
        days={alertSettings.days_of_week}
        setDays={(days) =>
          setAlertSettings({ ...alertSettings, days_of_week: days })
        }
        iconColors={timelineAlertIconColors}
      />
      <Divider sx={{ width: "100%" }} />
      {idleAlertEnabled && <PanelSectionHeader title="Trigger Criteria" />}
      {idleAlertEnabled && (
        <AlertTriggerSelector
          alertSetting={alertSettings}
          setAlertSetting={setAlertSettings}
        />
      )}
      {showIdleTime && (
        <PanelSectionHeader title="Idling Time (unit: seconds)" />
      )}
      {showIdleTime && (
        <TextField
          style={{ width: 100 }}
          size="small"
          placeholder="Idling time"
          type="number"
          inputProps={{
            max: MaxValidIdleTimeSeconds,
            min: MinValidIdleTimeSeconds,
          }}
          error={idleTimeError}
          helperText={idleTimeHelperText}
          value={idleDurationS.toString()}
          onChange={(event) => handleIdleTimeChange(event.target.value)}
        />
      )}

      <Divider sx={{ width: "100%" }} />
      <PanelSectionHeader title="Time" />
      <TimePicker
        placeholder="Start Time"
        time={startTime}
        setTime={setStartTime}
      />
      <TimePicker placeholder="End Time" time={endTime} setTime={setEndTime} />

      <Divider sx={{ width: "100%" }} />
      <Stack spacing={1}>
        <PanelSectionHeader title="Notify on" />
        <NotifyOptions
          alertSettings={alertSettings}
          setAlertSettings={setAlertSettings}
        />

        <Divider sx={{ width: "100%" }} />

        <PanelSectionHeader title="Alert name" />
        <TextField
          fullWidth
          size="small"
          placeholder="Alert name (Optional)"
          value={alertSettings.name ?? ""}
          onChange={(e) => {
            setAlertSettings({ ...alertSettings, name: e.target.value });
          }}
        />
      </Stack>
    </Stack>
  );
}
