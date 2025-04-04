import { useState } from "react";
import { ErrorState } from "../utils";
import { PanelHeader } from "../common_panel/PanelHeader";
import { PanelContent } from "../common_panel/PanelContent";
import {
  PanelContainer,
  PanelContainerProps,
} from "../common_panel/PanelContainer";
import {
  PanelSubmitButton,
  INITIAL_ERROR_STATE,
} from "../common_panel/PanelSubmitButton";
import { PanelDateTimePickers } from "../common_panel/PanelDateTimePickers";
import { DateTime } from "luxon";

export interface TimelapseParams {
  start_time: DateTime;
  end_time: DateTime;
  mac_address: string;
}

export interface TimelapseData {
  url: string;
  startTime: DateTime;
  endTime: DateTime;
}

export interface TimelapseSelectorProps {
  timezone: string;
  onCloseClick: () => void;
  onShowTimelapseClicked: (
    startTime: DateTime,
    endTime: DateTime
  ) => Promise<void>;
  containerProps?: PanelContainerProps;
}

export function TimelapseSelector({
  timezone,
  onCloseClick,
  onShowTimelapseClicked,
  containerProps,
}: TimelapseSelectorProps) {
  const [startTime, setStartTime] = useState<DateTime>(
    DateTime.now().minus({ days: 1 }).setZone(timezone)
  );
  const [endTime, setEndTime] = useState<DateTime>(
    DateTime.now().setZone(timezone)
  );

  const [errors, setErrors] = useState<ErrorState>(INITIAL_ERROR_STATE);

  return (
    <PanelContainer {...containerProps}>
      <PanelHeader title="TIMELAPSE" onCloseClick={onCloseClick} />
      <PanelContent sx={{ mt: 2, gap: 3 }}>
        <PanelDateTimePickers
          timezone={timezone}
          startTime={startTime}
          endTime={endTime}
          setStartTime={setStartTime}
          setEndTime={setEndTime}
          errors={errors}
          setErrors={setErrors}
        />
        <PanelSubmitButton
          errors={errors}
          setErrors={setErrors}
          processClickCb={async () =>
            await onShowTimelapseClicked(startTime, endTime)
          }
          buttonTextCb={(isLoading: boolean) =>
            isLoading ? "Loading.." : "Show Timelapse"
          }
        />
      </PanelContent>
    </PanelContainer>
  );
}
