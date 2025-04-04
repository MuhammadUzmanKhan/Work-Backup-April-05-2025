import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import { formatDateTime } from "utils/dates";
import { AnalyticsResponse, PerceptionsService } from "coram-common-utils";
import { ErrorState } from "../utils";
import { Divider, Stack } from "@mui/material";
import { RegionSelector } from "components/user_alerts/RegionSelector";
import { getSearchPolyons } from "hooks/timeline_page";
import { DrawingState } from "utils/drawing";
import { PanelHeader } from "../common_panel/PanelHeader";
import { PanelContent } from "../common_panel/PanelContent";
import {
  PanelContainer,
  PanelContainerProps,
} from "../common_panel/PanelContainer";
import { PanelSectionHeader } from "../common_panel/PanelSectionHeader";
import {
  INITIAL_ERROR_STATE,
  PanelSubmitButton,
} from "../common_panel/PanelSubmitButton";
import { PanelDateTimePickers } from "../common_panel/PanelDateTimePickers";
import { DateTime } from "luxon";

const regionSelectorIconColors = (selected: boolean) => ({
  color: selected ? "common.white" : "neutral.1000",
  backgroundColor: selected ? "primary.main" : "neutral.200",
});

interface AnalyticsPanelProps {
  cameraMacAddress: string;
  timezone: string;
  showAnalyticsDashboard: boolean;
  setAnalytics: Dispatch<SetStateAction<AnalyticsResponse>>;
  setShowAnalyticsDashboard: Dispatch<SetStateAction<boolean>>;
  onCloseClick: () => void;
  drawingState: DrawingState;
  containerProps?: PanelContainerProps;
}

export function AnalyticsPanel({
  cameraMacAddress,
  timezone,
  showAnalyticsDashboard,
  setShowAnalyticsDashboard,
  setAnalytics,
  onCloseClick,
  drawingState,
  containerProps,
}: AnalyticsPanelProps) {
  const [startTime, setStartTime] = useState<DateTime>(
    DateTime.now().minus({ days: 1 }).setZone(timezone)
  );
  const [endTime, setEndTime] = useState<DateTime>(
    DateTime.now().setZone(timezone)
  );
  const [errors, setErrors] = useState<ErrorState>(INITIAL_ERROR_STATE);

  // Fetch analytics data when the analytics dashboard is shown and the time range or
  // ROI changes
  const fetchAnalyticsData = useCallback(async () => {
    try {
      const analyticsData = await PerceptionsService.analyticsQuery({
        start_time: formatDateTime(startTime),
        end_time: formatDateTime(endTime),
        mac_address: cameraMacAddress,
        moving_detections_only: false,
        search_polys: getSearchPolyons(drawingState),
      });
      setAnalytics(analyticsData);
    } catch (e) {
      console.error(e);
    }
  }, [startTime, endTime, cameraMacAddress, drawingState, setAnalytics]);

  useEffect(() => {
    // Disable data fetch when there are errors in the query parameters
    const isDataFetchDisabled =
      errors.isSubmitError ||
      errors.isStartTimeInvalid ||
      errors.isEndTimeInvalid;

    if (isDataFetchDisabled) {
      setShowAnalyticsDashboard(false);
    }

    // Only fetch analytics data when the analytics dashboard is turned on and
    // data fetch is not disabled
    if (showAnalyticsDashboard && !isDataFetchDisabled) {
      fetchAnalyticsData();
    }
  }, [
    startTime,
    endTime,
    cameraMacAddress,
    drawingState,
    showAnalyticsDashboard,
    setAnalytics,
    fetchAnalyticsData,
    setShowAnalyticsDashboard,
    errors,
  ]);

  return (
    <PanelContainer {...containerProps}>
      <PanelHeader title="ANALYTICS" onCloseClick={onCloseClick} />
      <Stack p={1}>
        <PanelSectionHeader title="Region" />
        <RegionSelector iconColors={regionSelectorIconColors} />
      </Stack>
      <Divider sx={{ width: "100%" }} />
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
          processClickCb={async () => {
            await fetchAnalyticsData();
            setShowAnalyticsDashboard(true);
          }}
          buttonTextCb={(isLoading: boolean) =>
            isLoading ? "Loading" : "Show Analytics"
          }
        />
      </PanelContent>
    </PanelContainer>
  );
}
