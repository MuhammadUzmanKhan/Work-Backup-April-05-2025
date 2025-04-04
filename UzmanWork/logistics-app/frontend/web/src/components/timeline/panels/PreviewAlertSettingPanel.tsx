import { Button, Divider, Stack, TextField } from "@mui/material";
import {
  FeatureFlags,
  UserAlert,
  UserAlertSetting,
  TriggerType,
} from "coram-common-utils";
import { DaysOfWeekCheckboxes } from "components/user_alerts/DaysOfWeekCheckboxes";
import { ObjectTypeSelector } from "components/user_alerts/ObjectTypeSelector";
import { RegionSelector } from "components/user_alerts/RegionSelector";
import { AlertTriggerSelector } from "components/user_alerts/AlertTriggerSelector";
import { Dispatch, SetStateAction, useEffect } from "react";
import { PanelHeader } from "../common_panel/PanelHeader";
import {
  PanelContainer,
  PanelContainerProps,
} from "../common_panel/PanelContainer";
import { PanelSectionHeader } from "../common_panel/PanelSectionHeader";

import { useFeatureEnabled, useUserAlerts } from "utils/globals";
import { timelineAlertIconColors } from "../AlertUtils";
import { DateTime } from "luxon";
import { aggregatedTypesFromDetectionTypes } from "utils/user_alerts";

interface PreviewAlertSettingPanelProps {
  alertSetting: UserAlertSetting;
  onBackClick: () => void;
  onCloseClick: () => void;
  setDetectedAlerts: Dispatch<SetStateAction<UserAlert[]>>;
  timezone: string;
  containerProps?: PanelContainerProps;
}

function convertToDisplayTimestamp(time: string, timezone: string) {
  return DateTime.fromISO(time, { zone: timezone }).toLocaleString(
    DateTime.TIME_WITH_SECONDS
  );
}

export function PreviewAlertSettingPanel({
  alertSetting,
  onBackClick,
  onCloseClick,
  setDetectedAlerts,
  timezone,
  containerProps,
}: PreviewAlertSettingPanelProps) {
  const aggregatedTypes = aggregatedTypesFromDetectionTypes(
    alertSetting.detection_object_types
  );
  const alerts = useUserAlerts(alertSetting.id);

  const idleAlertEnabled = useFeatureEnabled(FeatureFlags.IDLE_ALERT_ENABLED);
  // Set state to determine to show the idle time field or not
  const showIdleTime =
    alertSetting.trigger_type === TriggerType.IDLING ? idleAlertEnabled : false;

  useEffect(() => {
    setDetectedAlerts(alerts.data ?? []);
  }, [alerts, setDetectedAlerts]);

  return (
    <PanelContainer {...containerProps}>
      <Stack>
        <PanelHeader
          title={`PREVIEW ${alertSetting.name ?? "Unnamed"}`}
          onCloseClick={onCloseClick}
        />
        <Stack spacing={1} p={1}>
          <PanelSectionHeader title="Region" />
          <RegionSelector readonly iconColors={timelineAlertIconColors} />
          <Divider sx={{ width: "100%" }} />

          <PanelSectionHeader title="Objects" />
          <ObjectTypeSelector
            readonly
            aggregatedObjectTypes={aggregatedTypes}
            iconColors={timelineAlertIconColors}
          />

          <Divider sx={{ width: "100%" }} />

          <PanelSectionHeader title="Days" />
          <DaysOfWeekCheckboxes
            readonly
            days={alertSetting.days_of_week}
            iconColors={timelineAlertIconColors}
          />
          <Divider sx={{ width: "100%" }} />

          <PanelSectionHeader title="Time" />
          <Stack direction="row" spacing={1}>
            <TextField
              label="From"
              value={
                alertSetting.start_time !== undefined &&
                convertToDisplayTimestamp(alertSetting.start_time, timezone)
              }
              disabled
            />
            <TextField
              label="To"
              value={
                alertSetting.end_time !== undefined &&
                convertToDisplayTimestamp(alertSetting.end_time, timezone)
              }
              disabled
            />
          </Stack>
          <Divider sx={{ width: "100%" }} />

          <PanelSectionHeader title="Trigger Criteria" />
          <AlertTriggerSelector alertSetting={alertSetting} />
          {showIdleTime && (
            <PanelSectionHeader title="Idling Time (unit: seconds)" />
          )}
          {showIdleTime && (
            <TextField
              disabled={true}
              style={{ width: 100 }}
              size="small"
              placeholder="Idling time"
              value={alertSetting.min_idle_duration_s ?? 0}
            />
          )}

          <PanelSectionHeader title="Notify on" />
          <TextField
            size="small"
            value={alertSetting.phone ?? "No phone notification"}
            disabled
          />
          <TextField
            size="small"
            value={alertSetting.email ?? "No email notification"}
            disabled
          />
          <Divider sx={{ width: "100%" }} />

          <PanelSectionHeader title="Alert name" />
          <TextField
            size="small"
            value={alertSetting.name ?? "Unnamed"}
            disabled
          />
        </Stack>
      </Stack>

      <Stack flexGrow="row" direction="row" spacing={2} p={1}>
        <Button
          variant="outlined"
          fullWidth={true}
          onClick={onBackClick}
          sx={{
            border: "1px solid black",
            color: "common.black",
          }}
        >
          Back
        </Button>
      </Stack>
    </PanelContainer>
  );
}
