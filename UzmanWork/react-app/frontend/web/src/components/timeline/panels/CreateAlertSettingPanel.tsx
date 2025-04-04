import { useAuth0 } from "@auth0/auth0-react";
import { LoadingButton } from "@mui/lab";
import { Box, Button, Stack } from "@mui/material";
import {
  DayOfWeek,
  DetectionObjectTypeCategory,
  TriggerType,
  UserAlertSettingCreate,
  UserAlertsService,
} from "coram-common-utils";
import { PanelHeader } from "../common_panel/PanelHeader";
import {
  PanelContainer,
  PanelContainerProps,
} from "../common_panel/PanelContainer";

import { toDetectionType } from "utils/detection_aggregation";

import { useContext, useState } from "react";
import { formatDateTime } from "utils/dates";
import {
  DrawingMode,
  DrawingStateContext,
  isDrawingStateContext,
} from "utils/drawing";
import {
  MinValidIdleTimeSeconds,
  MaxValidIdleTimeSeconds,
  UserAlertForm,
} from "../UserAlertForm";
import { DateTime } from "luxon";
import {
  aggregatedTypesFromDetectionTypes,
  roiFromDrawingState,
} from "utils/user_alerts";

export const INITIAL_ALERT_SETTINGS: UserAlertSettingCreate = {
  camera_mac_address: "",
  detection_object_types: [],
  roi_polygon: [],
  days_of_week: [] as DayOfWeek[],
  trigger_type: TriggerType.DO_NOT_ENTER,
  enabled: true,
};

interface CreateMode {
  mode: "create";
}

interface EditMode {
  mode: "edit";
  alertSettingId: number;
}

export interface CreateAlertSettingPanelProps {
  initialAlertSetting: UserAlertSettingCreate;
  timezone: string;
  onAlertCreated: (alertCreate: UserAlertSettingCreate) => void;
  onCloseClick: () => void;
  mode: CreateMode | EditMode;
  containerProps?: PanelContainerProps;
}

export function CreateAlertSettingPanel({
  initialAlertSetting,
  timezone,
  onAlertCreated,
  onCloseClick,
  mode,
  containerProps,
}: CreateAlertSettingPanelProps) {
  const { user } = useAuth0();
  const [alertSettings, setAlertSettings] =
    useState<UserAlertSettingCreate>(initialAlertSetting);
  const { drawingState } = isDrawingStateContext(
    useContext(DrawingStateContext)
  );

  const [aggregatedObjectTypes, setAggregatedObjectTypes] = useState<
    Set<DetectionObjectTypeCategory>
  >(aggregatedTypesFromDetectionTypes(alertSettings.detection_object_types));

  const [startTime, setStartTime] = useState<DateTime>(
    initialAlertSetting.start_time
      ? DateTime.fromISO(initialAlertSetting.start_time, { zone: timezone })
      : DateTime.now().setZone(timezone).startOf("day")
  );
  const [endTime, setEndTime] = useState<DateTime>(
    initialAlertSetting.end_time
      ? DateTime.fromISO(initialAlertSetting.end_time, { zone: timezone })
      : DateTime.now().setZone(timezone).endOf("day")
  );

  const [loading, setLoading] = useState(false);

  const isEditMode = mode.mode === "edit";

  const settingsAreValid = () => {
    if (aggregatedObjectTypes.size === 0) {
      return false;
    }
    if (
      alertSettings.trigger_type === TriggerType.IDLING &&
      (alertSettings.min_idle_duration_s === undefined ||
        alertSettings.min_idle_duration_s < MinValidIdleTimeSeconds ||
        alertSettings.min_idle_duration_s > MaxValidIdleTimeSeconds)
    ) {
      return false;
    }
    if (alertSettings.days_of_week.length === 0) {
      return false;
    }
    if (startTime === null || endTime === null) {
      return false;
    }
    if (
      drawingState.drawingMode === DrawingMode.Polygon &&
      drawingState.polygons.length === 0
    ) {
      return false;
    }
    if (
      drawingState.drawingMode === DrawingMode.Rectangle &&
      drawingState.rects.length === 0
    ) {
      return false;
    }
    return true;
  };

  async function handleSubmit() {
    setLoading(true);
    // NOTE(@lberg): we need to update the roi based on the drawing mode state
    const roi = roiFromDrawingState(drawingState);

    const alertSettingToCreate: UserAlertSettingCreate = {
      ...alertSettings,
      detection_object_types: Array.from(aggregatedObjectTypes)
        .map((type) => toDetectionType(type))
        .flat(),
      roi_polygon: roi,
      start_time: formatDateTime(startTime.setZone("utc")),
      end_time: formatDateTime(endTime.setZone("utc")),
      creator_name: user?.name,
      creation_time: formatDateTime(DateTime.now()),
      min_idle_duration_s:
        alertSettings.trigger_type === TriggerType.IDLING
          ? alertSettings.min_idle_duration_s
          : undefined,
    };

    try {
      if (isEditMode) {
        await UserAlertsService.updateUserAlert({
          ...alertSettingToCreate,
          id: mode.alertSettingId,
        });
      } else {
        await UserAlertsService.createUserAlert(alertSettingToCreate);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      onAlertCreated(alertSettingToCreate);
    }
  }

  const title = isEditMode
    ? `EDIT ALERT ${alertSettings.name}`
    : "CREATE ALERT";

  return (
    <PanelContainer {...containerProps}>
      <Box>
        <PanelHeader title={title} onCloseClick={onCloseClick} />
        <Stack p={1}>
          <UserAlertForm
            alertSettings={alertSettings}
            setAlertSettings={setAlertSettings}
            aggregatedObjectTypes={aggregatedObjectTypes}
            setAggregatedObjectTypes={setAggregatedObjectTypes}
            startTime={startTime}
            setStartTime={setStartTime}
            endTime={endTime}
            setEndTime={setEndTime}
          />
        </Stack>
      </Box>

      <Stack direction="row" spacing={2} p={1}>
        <LoadingButton
          loading={loading}
          color="secondary"
          variant="contained"
          disabled={!settingsAreValid()}
          onClick={handleSubmit}
          sx={{
            paddingX: "3rem",
            borderRadius: "0.3rem",
          }}
        >
          {isEditMode ? "Update" : "Create"}
        </LoadingButton>
        <Button
          variant="outlined"
          onClick={onCloseClick}
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
