import { UserAlert, UserAlertSetting } from "coram-common-utils";
import { Dispatch, SetStateAction, useContext, useState } from "react";
import {
  DrawingMode,
  DrawingStateContext,
  INITIAL_DRAWING_STATE,
  SimplePolygon,
  arrayToVector,
  isDrawingStateContext,
  isFullImageRectangle,
  isRectangle,
  polygonToDrawRect,
} from "utils/drawing";
import {
  CreateAlertSettingPanel,
  INITIAL_ALERT_SETTINGS,
} from "./panels/CreateAlertSettingPanel";
import { ListAlertSettingsPanel } from "./panels/ListAlertSettingsPanel";
import { PreviewAlertSettingPanel } from "./panels/PreviewAlertSettingPanel";
import { PanelContainerProps } from "./common_panel/PanelContainer";

interface TimelineUserAlertSettingsProps {
  timelineAlertState: TimelineAlertState;
  setTimelineAlertState: Dispatch<SetStateAction<TimelineAlertState>>;
  cameraMacAddress: string;
  timezone: string;
  onCloseClick: () => void;
  setDetectedAlerts: Dispatch<SetStateAction<UserAlert[]>>;
  containerProps?: PanelContainerProps;
}

// Enum to keep the state of the TimelineUserAlertSettings component. If it is
// in CREATE state when we show the alert creation UI. If it is in the LIST
// state, we show the list of alerts for the camera. If it is in the PREVIEW
// state, we show the preview of the selected alert.
export enum TimelineAlertState {
  CREATE = 0,
  LIST = 1,
  PREVIEW = 2,
  EDIT = 3,
}

export function TimelineUserAlertSettings({
  timelineAlertState,
  setTimelineAlertState,
  cameraMacAddress,
  timezone,
  onCloseClick,
  setDetectedAlerts,
  containerProps,
}: TimelineUserAlertSettingsProps) {
  const [selectedAlertSetting, setSelectedAlertSetting] = useState<
    UserAlertSetting | undefined
  >(undefined);

  const { setDrawingState } = isDrawingStateContext(
    useContext(DrawingStateContext)
  );

  function resetStatus() {
    setSelectedAlertSetting(undefined);
    setDetectedAlerts([]);
    setDrawingState(INITIAL_DRAWING_STATE);
  }

  function showAlertSettingPreview(alertSetting: UserAlertSetting) {
    setSelectedAlertSetting(alertSetting);
    // Set the drawing state if the alert setting has a ROI.
    if (alertSetting && alertSetting?.roi_polygon.length > 0) {
      const roi = alertSetting.roi_polygon.map(arrayToVector) as SimplePolygon;
      if (isRectangle(roi)) {
        setDrawingState((state) => ({
          ...state,
          drawingMode: isFullImageRectangle(roi)
            ? DrawingMode.FullImage
            : DrawingMode.Rectangle,
          rects: [polygonToDrawRect(roi)],
          polygons: [],
        }));
      } else {
        setDrawingState((state) => ({
          ...state,
          drawingMode: DrawingMode.Polygon,
          polygons: [
            alertSetting.roi_polygon.map(arrayToVector) as SimplePolygon,
          ],
          rects: [],
        }));
      }
    } else {
      setDrawingState((state) => ({
        ...state,
        drawingMode: DrawingMode.FullImage,
        rects: [],
        polygons: [],
      }));
    }
  }

  let contents = <></>;
  switch (timelineAlertState) {
    case TimelineAlertState.CREATE:
      contents = (
        <CreateAlertSettingPanel
          initialAlertSetting={{
            ...INITIAL_ALERT_SETTINGS,
            camera_mac_address: cameraMacAddress,
          }}
          onAlertCreated={() => {
            setTimelineAlertState(TimelineAlertState.LIST);
            resetStatus();
          }}
          timezone={timezone}
          onCloseClick={onCloseClick}
          containerProps={containerProps}
          mode={{
            mode: "create",
          }}
        />
      );
      break;
    case TimelineAlertState.LIST:
      contents = (
        <ListAlertSettingsPanel
          cameraMacAddress={cameraMacAddress}
          onCreateNewAlertSetting={() => {
            setTimelineAlertState(TimelineAlertState.CREATE);
            resetStatus();
          }}
          onEditAlertSetting={(alertSetting) => {
            setTimelineAlertState(TimelineAlertState.EDIT);
            showAlertSettingPreview(alertSetting);
          }}
          onSelectAlertForPreview={(alertSetting) => {
            setTimelineAlertState(TimelineAlertState.PREVIEW);
            showAlertSettingPreview(alertSetting);
          }}
          onCloseClick={onCloseClick}
          containerProps={containerProps}
        />
      );
      break;
    case TimelineAlertState.PREVIEW:
      contents = (
        <>
          {selectedAlertSetting && (
            <PreviewAlertSettingPanel
              alertSetting={selectedAlertSetting}
              onBackClick={() => {
                setTimelineAlertState(TimelineAlertState.LIST);
                resetStatus();
              }}
              onCloseClick={onCloseClick}
              setDetectedAlerts={setDetectedAlerts}
              timezone={timezone}
              containerProps={containerProps}
            />
          )}
        </>
      );
      break;
    case TimelineAlertState.EDIT:
      contents = (
        <>
          {selectedAlertSetting && (
            <CreateAlertSettingPanel
              initialAlertSetting={{
                ...selectedAlertSetting,
              }}
              onAlertCreated={() => {
                setTimelineAlertState(TimelineAlertState.LIST);
                resetStatus();
              }}
              timezone={timezone}
              onCloseClick={() => {
                setTimelineAlertState(TimelineAlertState.LIST);
                resetStatus();
              }}
              containerProps={containerProps}
              mode={{
                mode: "edit",
                alertSettingId: selectedAlertSetting.id,
              }}
            />
          )}
        </>
      );
      break;
    default: {
      const _exhaustiveCheck: never = timelineAlertState;
      return _exhaustiveCheck;
    }
  }

  return contents;
}
