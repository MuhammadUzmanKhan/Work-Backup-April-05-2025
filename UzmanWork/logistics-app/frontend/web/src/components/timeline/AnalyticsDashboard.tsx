import {
  AnalyticsResponse,
  DetectionObjectTypeCategory,
} from "coram-common-utils";
import { Stack } from "@mui/material";
import { DetectionAnalyticsChart } from "./DetectionAnalyticsChart";
import { TrackingAnalyticsCardGrid } from "./TrackingAnalyticsCardGrid";
import { DateTime } from "luxon";

interface AnalyticsDashboardProps {
  analytics: AnalyticsResponse;
  timezone: string;
  onTimeChange: (startTime: DateTime) => void;
}

export function AnalyticsDashboard({
  analytics,
  timezone,
  onTimeChange,
}: AnalyticsDashboardProps) {
  return (
    <Stack sx={{ backgroundColor: "white" }}>
      <TrackingAnalyticsCardGrid analytics={analytics} />
      <DetectionAnalyticsChart
        analytics={analytics}
        objectType={DetectionObjectTypeCategory.PERSON}
        chartTitle="People Count"
        timezone={timezone}
        chartColors={["#605FFF"]}
        onTimeChange={onTimeChange}
      />
      <DetectionAnalyticsChart
        analytics={analytics}
        objectType={DetectionObjectTypeCategory.VEHICLE}
        chartTitle="Vehicle Count"
        timezone={timezone}
        chartColors={["#10B981"]}
        onTimeChange={onTimeChange}
      />
    </Stack>
  );
}
